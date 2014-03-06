/**
	Try to tranform the Location String from ParlTrack an ID generated by eurlex.js
**/

var fs = require("fs");
var path = require("path");

var _index = [];
JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/directive.json'))).forEach(function(_dir){
	_index.push(_dir.id);
});

var fails = [];

var ptrel = function(_loc, _doc_id) {
	var _relp = ptloc(_loc, _doc_id);
	var _relations = [];

	if (_relp === "") return [];

	var _rels = (_relp.charAt(_relp.length-1) === '+') ? '+' : '';
	
	if (_relp.charAt(_relp.length-1) === '*') {
		// search with regex and concat
		var regx = new RegExp('^'+_relp.replace(/\*$/,'.*')+'$');
		_index.forEach(function(_id){
			if (_id.match(regx)) _relations.push(_id);
		});
	} else {
		var _rel = _relp.replace(/[^a-z0-9]+/g,'');
		if (_index.indexOf(_rel) >-1) {
			_relations.push(_rel+_rels);
		} else {
			if (_rel.match(/^a([0-9]+)p([0-9]+)i([0-9]+)$/)) {
				var __rel = _rel.replace(/^a([0-9]+)p([0-9]+)i([0-9]+)$/, 'a$1i$3');
				if (_index.indexOf(__rel) >-1) {
					_relations.push(__rel+_rels);
				}
			} else {
				if (_rel.match(/^a([0-9]+)p([0-9]+)$/)) {
					var __rel = _rel.replace(/^a([0-9]+)p([0-9]+)$/,'a$1t$2');
					if (_index.indexOf(__rel) >-1) {
						_relations.push(__rel+_rels);
					}
				}
			}
		}
	}
	
	return _relations;
	
}

var ptloc = function(_loc, _doc_id) {
	var _m = false;
	var _id = [];
	_loc = _loc.toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/,'');
	
	while (_loc.length > 0) {

		/* chapter */
		if (_m = _loc.match(/^chapter ([0-9]+)\s*/)) {
			_id.push("c"+_m[1]);
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* section */
		if (_m = _loc.match(/^section ([0-9]+)( title)?$/)) {
			_id.push("s"+_m[1]);
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* title */
		if (_m = _loc.match(/^title ([0-9]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("h"+_m[1]);
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* recital */
		if (_m = _loc.match(/^recital ([0-9]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("r"+_m[1]);
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* article */
		if (_m = _loc.match(/^article ([0-9]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("a"+_m[1]);
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}
		
		/* title */
		if (_m = _loc.match(/^title/)) {
			_id.push("=");
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}
		
		/* paragraph */
		if (_m = _loc.match(/^paragraph ([0-9]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("p"+_m[1]);
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* stupid point */
		if (_m = _loc.match(/^point ([0-9]+) point ([a-z]) new$/)) {
			_id.push("i"+_m[1]+"+");
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}
		
		/* point */
		if (_m = _loc.match(/^point ([a-z]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("i"+a2i(_m[1]));
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		/* point */
		if (_m = _loc.match(/^point ([0-9]+)\s*((([a-z]+)\s)?(new$))?/)) {
			_id.push("i"+_m[1]);
			if (_m[5] !== undefined) {
				_id.push("+");
			}
			_loc = _loc.replace(new RegExp(_m[0]), '');
			continue;
		}

		if (_m = _loc.match(/^(subparagraph|introductory part|introductory wording)/)) {

			switch (_m[1]) {
				
				case "subparagraph":

					if (_s = _loc.match(/^subparagraph ([0-9]+) introductory part$/)) {
						_id.push("t"+_s[1]);
						_loc = '';
						continue;
					}
					if (_s = _loc.match(/^subparagraph ([0-9]+) point ([a-z]+)$/)) {
						_id.push("i"+a2i(_s[2]));
						_loc = '';
						continue;
					}
					if (_s = _loc.match(/^subparagraph ([0-9]+) (([a-z]+) )?new$/)) {
						_id.push("+");
						_loc = '';
						continue;
					}
					if (_s = _loc.match(/^subparagraph ([0-9]+) ([a-z]+)?$/)) {
						_id.push("+");
						_loc = '';
						continue;
					}
					if (_s = _loc.match(/^subparagraph 1$/)) {
						_id.push("+");
						_loc = '';
						continue;
					}
					if (_s = _loc.match(/^subparagraph ([02-9][0-9]*)$/)) {
						_id.push("t"+(parseInt(_s[1],10)-1));
						_loc = '';
						continue;
					}
					_loc = '';
					continue;
				break;
				case "introductory part":
				case "introductory wording":
					_loc = '';
					continue;
				break;
				
			}

		}

		if (_m = _loc.match(/^annex/)) {
			// not in our scope. irrellevant? 
			return 'x';
		}

		if (_m = _loc.match(/^citation/)) {
			// not in our scope. irrellevant?
			return 'x';
		}

		console.error(_doc_id + " found so far: " +  _id.join('') + " stopped with: " +  _loc);
		process.exit(1);
		break;
	}
	return _id.join('').replace(/^a([0-9]+)$/,'a$1*');
}

function a2i(a) {
	return "_abcdefghijklmnopqrstuvwxyz".indexOf(a);
}

module.exports = ptrel;
