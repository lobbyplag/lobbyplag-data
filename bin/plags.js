#!/usr/bin/env node

/** 
	find plags by comparing amendments and proposals
**/

var fs = require("fs");
var path = require("path");
var colors = require("colors");
var natural = require("natural");
var crypto = require("crypto");
var diff = require(path.resolve(__dirname, "lib/diff"));
var argv = require("optimist")
	.boolean(['v','s'])
	.alias('v','verbose')
	.describe('v','increase verbosity up to -vvvvvv')
	.alias('s','simulate')
	.describe('s','do a dry run without overwriting')
	.argv;

/* check for verbosity level */
var verbosity = 0;
if (argv.v) {
	process.argv.forEach(function(arg){
		if (arg.match(/^\-([a-z0-9]+)$/)) verbosity += arg.replace(/[^v]/g, '').length;
		if (arg === '--verbose') verbosity++;
	});
}

/* sha1 */
String.prototype.sha1 = function() {
	return crypto.createHash('sha1').update(this.toString()).digest("hex");
}

/* helper for diff display */
var prettydiff = function(diff) {
	return diff.replace(/<span>([^<]+)<\/span>/g, function(d){
		return d.replace(/<span>([^<]+)<\/span>/g, '$1').black;
	}).replace(/<ins>([^<]+)<\/ins>/g, function(d){
		return d.replace(/<ins>([^<]+)<\/ins>/g, '$1').green;
	}).replace(/<del>([^<]+)<\/del>/g, function(d){
		return d.replace(/<del>([^<]+)<\/del>/g, '$1').red;
	});
}

/* comparison method: diceroll */
var _stat_count = 0;
var diceroll = function(str_a, str_b) {
	/* get trigrams from both strings */
	var _triples_a = natural.NGrams.trigrams(str_a);
	var _triples_b = natural.NGrams.trigrams(str_b);
	var _count = 0;
	var _total = 0;
	/* calculate dice-coefficient of every trigram */
	_triples_a.forEach(function(_trigram_a){
		_triples_b.forEach(function(_trigram_b){
			_stat_count++;
			var _dice = natural.DiceCoefficient(_trigram_a.join(' '), _trigram_b.join(' '));
			/* take every match with a dice coefficient of >0.5 into account */
			if (_dice > 0.5) {
				if (argv.v && verbosity >= 5) console.error('\r'+'DICE'.inverse.bold.magenta, _dice.toFixed(3).green.bold, _trigram_a.join(' ').cyan, _trigram_b.join(' ').yellow);
				_count++;
				_total += _dice;
			}
		});
	});
	/* readjust the 0.5-1 result range to a 0-1 result range */
	var _diceroll = (_count === 0) ? 0 : (((_total/_count)-0.5)*2);
	if (argv.v && verbosity >= 4) console.error('\r'+'ROLL'.inverse.bold.magenta, _diceroll.toFixed(3).green.bold, str_a.cyan, str_b.yellow);
	return _diceroll;
}

/* load amendments and proposals */

if (argv.v) console.error('hello.'.green.inverse.bold, 'loading data.');

var _amds = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/amendments.json")));
var _props = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/proposals.json")));

/* loading already-discovered plags, if they exist */
var _found_plags = []
var _result = [];
if (fs.existsSync(path.resolve(__dirname, "../data/plags.json"))) {
	_result = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/plags.json")));
	_result.forEach(function(_plag){
		_found_plags.push(_plag.uid);
	});
}

/* index amendments and proposals by uid and relation */
if (argv.v) console.error('done.'.green.inverse.bold, 'making indexes.');

var _index = [];
var _amds_idx = {};
var _props_idx = {};
var _amds_uidx = {};
var _props_uidx = {};

_amds.forEach(function(_amd,idx){
	_amds_uidx[_amd.uid] = idx;
	_amd.relations.forEach(function(_rel){
		if (_index.indexOf(_rel) < 0) _index.push(_rel);
		if (!(_rel in _amds_idx)) _amds_idx[_rel] = [];
		_amds_idx[_rel].push(_amd);
	});
});

_props.forEach(function(_prop,idx){
	_props_uidx[_prop.uid] = idx;
	_prop.relations.forEach(function(_rel){
		if (_index.indexOf(_rel) < 0) _index.push(_rel);
		if (!(_rel in _props_idx)) _props_idx[_rel] = [];
		_props_idx[_rel].push(_prop);
	});
});

_index.sort();

/* walk through comparison */
_length = 0;
_count = 0;
_display = '';

_index.forEach(function(_rel){
	if (_rel in _props_idx) _props_idx[_rel].forEach(function(_prop){
		if (_rel in _amds_idx) _amds_idx[_rel].forEach(function(_amd){
			_length++;
		});
	});
});

if (argv.v) console.error('ready.'.green.inverse.bold, 'lets make', _length.toString().green.bold, 'comparisons.');

_index.forEach(function(_rel){
	if (_rel in _props_idx) _props_idx[_rel].forEach(function(_prop){
		if (_rel in _amds_idx) _amds_idx[_rel].forEach(function(_amd){
			
			/* gauge update */
			_count++;
			var _perc = (Math.round((_count/_length)*1000)/10).toFixed(1);
			if (_perc !== _display) {
				_display = _perc;
				process.stdout.write('\r'+(" comp ".inverse.bold.green)+(" "+_display+"%").cyan);
			}

			/* check if collission was already found */
			var _plag_uid = (_prop.uid+_amd.uid).sha1();
			if (_found_plags.indexOf(_plag_uid) >= 0) {
				return;
			}
			
			/* check for overwhelming similarity */
			// FIXME
			
			var _dice = 0;
			
			/* compare insertions */
			_prop.text.ins.forEach(function(_str_a){
				_amd.text[0].ins.forEach(function(_str_b){
					if (_str_a === 'new' || _str_b === 'new') return;
					var _thisdice = diceroll(_str_a, _str_b);
					if (_thisdice > _dice) _dice = _thisdice;
				});
			});
			if (_dice > 0 && argv.v && verbosity >= 2) console.error('\r'+'WALK'.inverse.bold.magenta, 'INS'.green.bold, _count.toString(), ((_dice > 0.4) ? _dice.toFixed(3).magenta.bold : _dice.toFixed(3).white.bold));
			if (_dice > 0 && argv.v && verbosity >= 3) console.error('\n'+'----------------------'.grey+'\n'+prettydiff(_prop.diff)+'\n'+'----------------------'.grey+'\n'+prettydiff(_amd.text[0].diff)+'\n');

			if (_dice > 0.4) {
				_result.push({
					"uid": _plag_uid,
					"relations": [_rel],
					"amendment": _amd.uid,
					"proposal": _prop.uid,
					"implication": null,
					"match": _dice,
					"checked": false,
					"verified": false,
					"processing": {
						"checked": 0,
						"verified": 0
					}
				});
				return;
			}

			_dice = 0;
			/* compare deletions, skip full deletions */
			if (_prop.text.new.replace(/^\s*deleted\s*$/,'') !== "" && _amd.text[0].new.replace(/^\s*deleted\s*$/,'') !== "")
			_prop.text.del.forEach(function(_str_a){
					_amd.text[0].del.forEach(function(_str_b){
					if (_str_a === 'deleted' || _str_b === 'deleted') return;
					var _thisdice = diceroll(_str_a, _str_b);
					if (_thisdice > _dice) _dice = _thisdice;
				});
			});
			if (_dice > 0 && argv.v && verbosity >= 2) console.error('\r'+'WALK'.inverse.bold.magenta, 'DEL'.red.bold, _count.toString(), ((_dice > 0.4) ? _dice.toFixed(3).magenta.bold : _dice.toFixed(3).white.bold));
			if (_dice > 0 && argv.v && verbosity >= 3) console.error('\n'+'----------------------'.grey+'\n'+prettydiff(_prop.diff)+'\n'+'----------------------'.grey+'\n'+prettydiff(_amd.text[0].diff)+'\n');
			
			if (_dice > 0.4) {
				_result.push({
					"uid": _plag_uid,
					"relations": [_rel],
					"amendment": _amd.uid,
					"proposal": _prop.uid,
					"implication": null,
					"match": _dice,
					"checked": false,
					"verified": false,
					"processing": {
						"checked": 0,
						"verified": 0
					}
				});
				return;
			}
				
			/* check for full deletion */
			// FIXME

		});
	});
});

_result.sort(function(a,b){
	return b.match-a.match;
});

process.stdout.write('\r'+(" comp ".inverse.bold.magenta)+(" complete. ").green+'\n');

if (argv.v) console.error('stat'.inverse.green.bold, _stat_count.toString().magenta, 'text part comparisons with', _result.length.toString().magenta, 'possible matches');

if (argv.s) {
	fs.writeFileSync(path.resolve("debug-plags.json"), JSON.stringify(_result,null,'\t'), 'utf-8');
} else {
	fs.writeFileSync(path.resolve(__dirname, "../data/plags.json"), JSON.stringify(_result,null,'\t'), 'utf-8');
}

console.error(' <3 '.bold.inverse.magenta, 'made with datalove'.bold.magenta);
process.exit(0);
