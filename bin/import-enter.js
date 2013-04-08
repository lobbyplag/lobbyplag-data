#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var colors = require("colors");
var crypto = require("crypto");
var diff = require(path.resolve(__dirname, "lib/diff"));
var argv = require("optimist")
	.boolean(['v','s'])
	.alias('v','verbose')
	.describe('v','shiny extra information')
	.alias('s','simulate')
	.describe('s','don\'t actually perform an update')
	.usage('$0'.magenta+' '+'[options]'.red+' '+'[<datadir>]'.green)
	.argv

/* my little sha1() */
String.prototype.sha1 = function() {
	return crypto.createHash('sha1').update(this.toString()).digest("hex");
}

/* get data */
var _proposals = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/proposals.json')));
var _documents = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/documents.json')));
var _lobbyists = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/lobbyists.json')));

/* build document index */
var _documents_index = {};
_documents.forEach(function(_document, idx){
	_documents_index[_document.uid] = idx;
});

/* build lobbyist index */
var _lobbyists_index = {};
_lobbyists.forEach(function(_lobbyist, idx){
	_lobbyists_index[_lobbyist.id] = idx;
});

/* collision prevention */
var _collider = {};
_proposals.forEach(function(_proposal){
	var collisionstring = [_proposal.doc_uid, _proposal.page, _proposal.relations.join('.')].join('_').sha1();
	if (collisionstring in _collider) {
		if (_proposal.relations.length > 0 && argv.v) console.error("Existing Collision".inverse.red.bold, _proposal.uid.yellow, '='.cyan, _collider[collisionstring].yellow);
	} else {
		_collider[collisionstring] = _proposal.uid;
	}
});

/* determine data dir */
if (argv._.length === 0) {
	var _importdir = path.resolve(__dirname, '../import');
} else {
	var _importdir = path.resolve(argv._[0]);
}

/* walk data dir */
var importer = function(callback) {
	fs.readdir(_importdir, function(err, _files){
		if (err) {
			if (argv.v) console.error('Error!'.inverse.bold.red, err);
			process.exit(1);
		}
		var _process_counter = 0;
		_files.forEach(function(_file){
			fs.readFile(path.resolve(_importdir, _file), function(err, _data){
				_process_counter++;
				if (err) {
					if (argv.v) console.error('Error!'.inverse.bold.red, err);
					process.exit(1);
				}
				var _proposal = JSON.parse(_data);
			
			
				/* fix relations */
				var _relations = [];
				_proposal.relations.forEach(function(_rel){
					if (_proposal.relationwhere === 'after') {
						_rel += '+';
					}
					_relations.push(_rel);
				});
			
				/* check for double */
				var collisionstring = [_proposal.doc_uid, _proposal.page, _relations.join('.')].join('_').sha1();
				if (collisionstring in _collider) {
					if (argv.v) console.error("New Collision".inverse.red.bold, _proposal.uid.yellow, '='.cyan, _collider[collisionstring].yellow);
					if (_process_counter === _files.length) callback();
					if (!argv.s) fs.unlink(path.resolve(_importdir, _file));
				} else {
					
					_collider[collisionstring] = _proposal.uid;

					/* we don't process comments here */
					if (("comment" in _proposal) && _proposal.comment === true) {
						if (_process_counter === _files.length) callback();
						return;
					}

					_proposal.text.old = _proposal.text.old.trim().clean();
					_proposal.text.new = _proposal.text.new.trim().clean();

					var _diff = diff(_proposal.text.old, _proposal.text.new);

					/* determine lobbyist */
					var _lobbyist = _documents[_documents_index[_proposal.doc_uid]].lobbyist;
					if (_lobbyist === null || !(_lobbyist in _lobbyists_index)) {
						var _lobbyist_title = null;
					} else {
						var _lobbyist_title = _lobbyists[_lobbyists_index[_lobbyist]].title;
					}

					/* get inserted and  deleted bits */
					var _del = [];
					var _del_match = _diff.match(/<del>([^<]+)<\/del>/g);
					if (_del_match) _del_match.forEach(function(_bit){
						_del.push(_bit.replace(/<del>([^<]+)<\/del>/,'$1'));
					});
					var _ins = [];
					var _ins_match = _diff.match(/<ins>([^<]+)<\/ins>/g);
					if (_ins_match) _ins_match.forEach(function(_bit){
						_ins.push(_bit.replace(/<ins>([^<]+)<\/ins>/,'$1'));
					});

					/* push */
					_proposals.push({
						"doc": _proposal.doc,
						"page": _proposal.page,
						"text": {
							"old": _proposal.text.old,
							"new": _proposal.text.new,
							"del": _del,
							"ins": _ins
						},
						"diff": _diff,
						"relations": _relations,
						"patterns": _relations,
						"uid": _proposal.uid,
						"doc_uid": _proposal.doc_uid,
						"lobbyist_title": _lobbyist_title
					});
					
					if (!argv.s) fs.unlink(path.resolve(_importdir, _file));
					if (_process_counter === _files.length) callback();
					
				}
			
			});
		});
	});
}

importer(function(){
	switch (argv.s) {
		case true: var _file_out = path.resolve('test-proposals.json'); break;
		case false: var _file_out = path.resolve(__dirname, '../data/proposals.json'); break;
	}
	
	fs.writeFileSync(_file_out, JSON.stringify(_proposals,null,'\t'));
	console.error(' <3 '.bold.magenta.inverse, 'made with datalove'.bold.magenta);

});

