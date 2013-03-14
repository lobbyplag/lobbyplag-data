#!/usr/bin/env node
/**
	retrieve amendments from parltrack
**/

var fs = require("fs");
var xz = require("xz-pipe");
var path = require("path");
var colors = require("colors");
var moment = require("moment");
var http = require("http");
var url = require("url");
var qs = require("querystring");
var crypto = require("crypto");
var diff = require("./lib/diff");
var ptloc = require("./lib/ptloc");
var argv = require("optimist")
	.boolean(['n','o'])
	.alias('o','overwrite')
	.describe('o','overwrite existing file')
	.alias('c','cache')
	.describe('c','cache file directory')
	.alias('f','flush')
	.describe('f','flush cache')
	.alias('r','ref')
	.describe('r','reference; default: "2012/0011(COD)"')
	.usage('$0'.magenta+' '+'[options]'.red+' '+'[<amendments.json>]'.green)
	.argv;

String.prototype.sha1 = function() {
	return crypto.createHash('sha1').update(this.toString()).digest("hex");
}

/* file to write */
var _file = (argv._.length >= 1) ? path.resolve(argv._[0]) : path.resolve(__dirname, '../data/amendments.json');

/* http source */
var _pt_source = "http://parltrack.euwiki.org/dumps/ep_amendments.json.xz";
var _pt_reference = argv.r || "2012/0011(COD)";



/* load mep.json */
var _meps = require(path.resolve(__dirname, '../data/mep.json'));

/* load current amendments.json */
var _amds = require(path.resolve(__dirname, '../data/amendments.json'));

/* make amendment index */
var _amdsx = {};
_amds.forEach(function(_amd,x){
	_amdsx[_amd.uid] = x;
});

/* find or create cache folder */
var _cachedir = (argv.c) ? path.resolve(argv.c) : path.resolve(__dirname, '../cache');
if (!fs.existsSync(_cachedir)) fs.mkdirSync(_cachedir);
if (!fs.existsSync(_cachedir)) {
	console.error('ERR!'.inverse.bold.red, 'could not create cache folder');
	process.exit(1);
} else {
	var _chachedir_stat = fs.statSync(_cachedir);
	if (!_chachedir_stat.isDirectory()) {
		console.error('ERR!'.inverse.bold.red, 'cache folder is not a directory');
		process.exit(1);
	}
	if (("getuid" in process) && process.getuid() !== _chachedir_stat.uid) {
		console.error('ERR!'.inverse.bold.red, 'cache folder is not owned by you');
		process.exit(1);
	}
}

/* retrieve parltrack-dump */
var _load_data = function(callback){
	var _cachefile = path.resolve(_cachedir, 'ep_amendments.json');
	
	/* get from server and write to cache */
	var _retrieve = function() {
		http.get(_pt_source, function(res){
			if (res.statusCode !== 200) {
				console.error('ERR!'.inverse.bold.red, 'could not retrieve', _pt_source.yellow);
				process.exit(1);
			}
			res.pipe(xz.d(function(data){
				
				var _data = [];
				
				JSON.parse(data).forEach(function(item){
					if (item.reference === _pt_reference) _data.push(item);
				});
				
				/* write cache */
				fs.writeFile(_cachefile, JSON.stringify(_data,null,'\t'));

				/* callback */
				callback(_data);

			}));
		}).on('error', function(e){
			console.error('ERR!'.inverse.bold.red, e.toString());
			process.exit(1);
		});
	}
	
	/* get from cache */
	var _load_cache = function() {
		fs.readFile(_cachefile, {flag: "r", encoding: "utf-8"}, function(err, data){
			if (err) {
				console.error('ERR!'.inverse.bold.red, 'cache file not readable');
				process.exit(1);
			}
			callback(JSON.parse(data));
		});
	}
	
	if (argv.f || !fs.existsSync(_cachefile)) {
		/* get fresh data */
		_retrieve();
	} else {
		
		/* force update if cache file is older than three hours */
		if (moment(fs.statSync(_cachefile).mtime).format('X') < moment().subtract('hours', 3).format('X')) {
			_retrieve();
		} else {

			/* get from cache */
			_load_cache();

		}
		
	}
	
};

var _parse_data = function(_raw, callback) {

	var _parsed = [];
	
	_raw.forEach(function(item){
	
		
		var _text_old = ('old' in item) ? item.old.join(' ').replace(/\s+/g,' ').replace(/^\s+|\s+$/,'').replace(/^new$/,'') : '';
		var _text_new = ('new' in item) ? item.new.join(' ').replace(/\s+/g,' ').replace(/^\s+|\s+$/,'').replace(/^deleted$/,'') : '';
		var _text_diff = diff(_text_old, _text_new);
		var _text_del = _text_diff.replace(/<ins>[^<]+<\/ins>/g, '').replace(/<span>[^<]+<\/span>/g, '').replace(/<\/del><del>/g, '%split%').replace(/<[^>]+>/g, '');
		var _text_ins = _text_diff.replace(/<del>[^<]+<\/del>/g, '').replace(/<span>[^<]+<\/span>/g, '').replace(/<\/ins><ins>/g, '%split%').replace(/<[^>]+>/g, '');
		
		_text_del = (_text_del === "") ? [] : _text_del.split('%split%');
		_text_ins = (_text_ins === "") ? [] : _text_ins.split('%split%');

		var _procedure = item.reference.toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/,'').split(/ /);

		/* make legacy parltrack id from amendment number, url and black magic */
		var _ptid = ['am', item.seq.toString(), qs.parse(url.parse(item.src).query).pubRef.split(/\+/).splice(2,1).pop()].join('-');
		
		/* make legacy lobbyplag id from committee, date, amendment */
		var _lpid = [_procedure.join('.'), item.committee[0].toLowerCase(), moment(item.date).format('YYYYMMDD'), parseInt(item.seq,10)].join('-');
		
		/* authors list */
		
		var _authors = [];
		var _author_ids = [];

		item.meps.forEach(function(_id){

			/* this fix is dedicated to Baroness Sarah Ludford, who with her stupid peerage stops the parser */
			if (!(_id in _meps) && _id === '4de186490fb8127435bdc02d') _id = "4f1ad933b819f207b3000001";

			if (!(_id in _meps)) {
				console.error('ERR!'.inverse.bold.red, 'Baroness Sarah Ludford Exception:', _id.red, item.authors.yellow);
				process.exit(1);
			}
			
			_authors.push(_meps[_id].name);
			_author_ids.push(_id);

		});
		
		var _uid = _lpid.sha1();
		
		_parsed.push({
			"uid": _uid,
			"committee": item.committee[0].toLowerCase(),
			"number": parseInt(item.seq,10),
			"date": moment(item.date).format('YYYY-MM-DD'),
			"version": 0,
			"state": 0,
			"procedure": {
				"type": _procedure[2],
				"year": _procedure[0],
				"number": _procedure[1]
			},
			"ids": {
				"parltrack": _ptid,
				"lobbyplag": _lpid
			},
			"authors": _authors,
			"author_ids": _author_ids,
			"relations": ptloc(item.location[0][1]),
			"text": [
				{
					"lang": "en", // parltrack is always 'en'
					"old": _text_old,
					"new": _text_new,
					"del": _text_del,
					"ins": _text_ins,
					"diff": _text_diff,
					"location": item.location[0][1]
				}
			]
		});
	
	});
	
	callback(_parsed);
	
};

var _main = function() {
	_load_data(function(_data_raw){
		_parse_data(_data_raw, function(_data_parsed){

			var _newx = [];
			
			
			if (argv.o || !fs.existsSync(_file)) {
				/* simply save */
				fs.writeFileSync(_file, JSON.stringify(_data_parsed,null,'\t'),'utf-8');
			} else {
				/* merge */
				_data_parsed.forEach(function(_item){
					_newx.push(_item.uid);
					if (_item.uid in _amdsx) {
						console.log("EXISTS".inverse.bold.yellow, _item.ids.lobbyplag);
					} else {
						console.log("INSERT".inverse.bold.green, _item.ids.lobbyplag);
						_amds.push(_item);
					}
				});
				_amds.forEach(function(_item){
					if (_newx.indexOf(_item.uid) < 0) {
						console.log("!WARN!".inverse.bold.red, _item.ids.lobbyplag.red);
					}
				});
				fs.writeFileSync(_file, JSON.stringify(_amds,null,'\t'),'utf-8');
			}
			/* done */
			console.error(' <3 '.bold.magenta.inverse, 'made with datalove'.bold.magenta);
			process.exit(0);
			
		});
	});
}

_main();