#!/usr/bin/env node
/**
 retrieve meps from parltrack
 **/

var fs = require("fs");
//var xz = require("xz-pipe");
var path = require("path");
var colors = require("colors");
var moment = require("moment");
var http = require("http");
var crypto = require("crypto");
var argv = require("optimist")
	.boolean(['n', 'o'])
	.alias('o', 'overwrite')
	.describe('o', 'overwrite existing file')
	.alias('c', 'cache')
	.describe('c', 'cache file directory')
	.alias('f', 'flush')
	.describe('f', 'flush cache')
	.usage('$0'.magenta + ' ' + '[options]'.red + ' ' + '[<mep.json>]'.green)
	.argv;

String.prototype.sha1 = function () {
	return crypto.createHash('sha1').update(this.toString()).digest("hex");
}

Array.prototype.findByLongName = function (name) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].long === name) {
			return this[i];
		}
		if (this[i].alt) {
			for (var j = 0; j < this[i].alt.length; j++) {
				if (this[i].alt[j] === name) {
					return this[i];
				}
			}
		}
	}
	return null;
};

/* file to write */
var _file = (argv._.length >= 1) ? path.resolve(argv._[0]) : path.resolve(__dirname, '../data/mep.json');

/* http source */
var _pt_source = "http://parltrack.euwiki.org/dumps/ep_meps_current.json.xz";

/* load current constituencies.json */
var constituencies = require(path.resolve(__dirname, '../data/constituencies.json'));

/* load current countries.json */
var countries = require(path.resolve(__dirname, '../data/countries.json'));

/* load current meps.json */
var meps = require(path.resolve(__dirname, '../data/mep.json'));

/* load current amendments.json */
var amds = require(path.resolve(__dirname, '../data/amendments.json'));

/* load current groups.json */
var groups = require(path.resolve(__dirname, '../data/groups.json'));
var groupsByShort = {};
for (var key in groups) {
	groups[key].id = key;
	groupsByShort[groups[key].short] = groups[key];
}

/* load current committees.json */
var committees = require(path.resolve(__dirname, '../data/committees.json'));


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
var _load_data = function (callback) {
	var _cachefile = path.resolve(_cachedir, 'ep_meps.json');

	/* get from server and write to cache */
	var _retrieve = function () {

		http.get(_pt_source,function (res) {
			if (res.statusCode !== 200) {
				console.error('ERR!'.inverse.bold.red, 'could not retrieve', _pt_source.yellow);
				process.exit(1);
			}
			res.pipe(xz.d(function (data) {
				fs.writeFileSync(_raw_cachefile, data);
				callback(JSON.parse(_data));
			}));
		}).on('error', function (e) {
				console.error('ERR!'.inverse.bold.red, e.toString());
				process.exit(1);
			});
	}

	/* get from cache */
	var _load_cache = function () {
		console.log('Loading cache');
		fs.readFile(_cachefile, {flag: "r", encoding: "utf-8"}, function (err, data) {
			if (err) {
				console.error('ERR!'.inverse.bold.red, 'cache file not readable');
				process.exit(1);
			}
			callback(JSON.parse(data));
		});
	}

	if (argv.f || !fs.existsSync(_cachefile)) {
		/* get fresh data */
		console.log('retrieving file');
		_retrieve();
	} else {

		/* force update if cache file is older than three hours */
		if (moment(fs.statSync(_cachefile).mtime).format('X') < moment().subtract('hours', 3).format('X')) {
			console.log('cache too old: retrieving file');
			_retrieve();
		} else {
			console.log('using cache');
			/* get from cache */
			_load_cache();

		}

	}

};

var _get_parltrak_mep = function (_mep, _data_parsed) {
	for (var i = 0; i < _data_parsed.length; i++) {
		var _pmep = _data_parsed[i];
		if (_mep.lqdn.indexOf('/' + _pmep.UserID + '/') >= 0) {
			return _pmep;
		}
	}
	return null;
};

var _get_countrycode = function (name) {
	for (key in countries) {
		if (countries[key] === name)
			return key;
	}
	console.log('Unknown Country ' + name);
	return 'unknown';
};

var _merge_mep = function (id, _data_parsed) {
	var _mep = meps[id];
	if (_mep) {
		var _pmep = _get_parltrak_mep(_mep, _data_parsed);
		if (!_pmep) {
			console.log('mep ' + id + ' not found in parltrack data')
		} else {
			delete(_mep.party);
			_mep.parltrack_id = _pmep.UserID;
			_mep.active = _pmep.active;
			_mep.urls = {};
			if ((_pmep.Facebook) && (_pmep.Facebook.length > 0)) {
				_mep.urls['facebook'] = _pmep.Facebook[0];
			}
			if ((_pmep.RSS) && (_pmep.RSS.length > 0)) {
				_mep.urls['rss'] = _pmep.RSS[0];
			}
			if (_pmep.meta) {
				_mep.urls['europarl'] = _pmep.meta.url;
			}
			if ((_pmep.Twitter) && (_pmep.Twitter.length > 0)) {
				_mep.urls['twitter'] = _pmep.Twitter[0];
			}
			if (_pmep.Photo) {
				_mep.urls['photo'] = _pmep.Photo;
			}
			if ((_pmep.Homepage) && (_pmep.Homepage.length > 0)) {
				_mep.urls['homepage'] = _pmep.Homepage[0];
			}
			var _groups = _pmep.Groups.filter(function (g) {
				return g.end === '9999-12-31T00:00:00';
			});
			if (_groups.length > 1) {
				console.log('Too many groups');
			} else if (_groups.length > 0) {
				var _group_ids;
				if (typeof _groups[0].groupid === 'string') {
					_group_ids = [_groups[0].groupid];
				} else {
					_group_ids = _groups[0].groupid;
				}
				var _found = false;
				_group_ids.forEach(function (gi) {
					if (gi === 'PPE') {
						gi = 'EPP';
					} else if (gi === 'Verts/ALE') {
						gi = 'Greens/EFA';
					}
					if (groupsByShort[gi]) {
						_found = true;
						_mep.group = groupsByShort[gi].id;
					}
				});
				if (!_found)
					console.log('Group ' + _group_ids + ' could no be updated');
			}
			var _constituencies = _pmep.Constituencies.filter(function (c) {
				return c.end === '9999-12-31T00:00:00';
			}).map(function (c) {
					var _cc = _get_countrycode(c.country);
					constituencies[_cc] = constituencies[_cc] || [];
					var _party = constituencies[_cc].findByLongName(c.party);
					if ((!_party)) {
						if (c.party !== '-') {
							_party = {id: _cc + "_", short: "", long: c.party, group: _mep.group};
							constituencies[_cc].push(_party);
							console.log('Check new local party, set an ID & shortname in "constituencies.json" -> run the script again: ' + c.party);
							fs.writeFileSync(path.resolve(__dirname, '../data/constituencies.json'), JSON.stringify(constituencies, null, '\t'), 'utf-8');
						}
						return '';
					}
					return _party.id;
				});
			delete _mep.constituencies;
			if (_constituencies.length > 0) {
				_mep.constituency = _constituencies[0];
			}

			_mep.committees = _pmep.Committees.filter(function (c) {
				return (c.end === '9999-12-31T00:00:00') && (c.committee_id);
			}).map(function (c) {
					if (!committees[c.committee_id.toLowerCase()]) {
						committees[c.committee_id.toLowerCase()] = c.Organization;
						console.log('Added Committee: ' + c.Organization);
						fs.writeFileSync(path.resolve(__dirname, '../data/committees.json'), JSON.stringify(committees, null, '\t'), 'utf-8');
					}
					return {id: c.committee_id.toLowerCase(), role: c.role}
				});
		}
	} else {
		console.error('mep ' + id + ' not found');
		process.exit(0);
	}
};

var _merge_data = function (_data_parsed) {
	console.log('merging....');
	var _done = {};
	amds.forEach(function (amend) {
		amend.author_ids.forEach(function (id) {
			if (!_done[id]) {
				_done[id] = true;
				_merge_mep(id, _data_parsed);
			}
		});
	});
	for (key in meps) {
		if (!_done[key ]) {
			_done[key ] = true;
			_merge_mep(key, _data_parsed);
		}
	}
	fs.writeFileSync(_file, JSON.stringify(meps, null, '\t'), 'utf-8');
}

var _main = function () {
	_load_data(function (_data_raw) {
		/* merge */
		_merge_data(_data_raw);
		/* done */
		console.log(' <3 '.bold.magenta.inverse, 'made with datalove'.bold.magenta);
	});
}

_main();