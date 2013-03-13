# LobbyPlag Data

This repository contains all the data [LobbyPlag](http://www.lobbyplag.eu/) is built upon.

## Raw data

The folder `raw` contains the data sources like lobby papers in arbitrary formats.

## Open Data

The folfer `data` contains the pretty and usable open data.

### Directive

The file `directive.json` contains the textual parts of the GDPR in 23 languages and in structured form.

```` javascript
[
	{
		"id": "h1", 		// the id of the element
		"type": "title",	// title, recital, chapter, section, article, paragraph, point or text
		"literal": null,	// the "a" in "point a)" or "I" in "Chapter I", null if none
		"parent": "_",		// the id of the parent, "_" for top level elements
		"children": [],		// an array of the ids of all children elements
		"text": {			// object contaning the texts
			"en": "...",	// key is the language
			"de": "..."		// value is the text
		}
	},
	// ...
]
````

### Amendments

The file `amendments.json` contains amendments by [MEPs](#members-of-the-european-parliament).

```` javascript
[
	{
		"uid": "a3e2d3e2t..."				// uid of the amendment
		"committee": "imco",				// [Committee](#committees)
		"number": "1",						// amendment number
		"state": 0,							// voting state. 0=undecides, -1=rejected, 1=approved
		"procedure": {						
			"type": "cod",					// type of procedure. (cod means prdinary legislative)
			"year": "2012",					// year the procedure was started
			"number": "0011"				// number of the procedure
		},
		"ids": {
			"parltrack": "am-0-PE-...",		// id on parltrack 
			"lobbyplag": "2012.0011..."		// old lobbyplag id
		},
		"authors": [						// array of authors
			"Name NAME",					// should relate to [mep.json](#members-of-the-european-parliament)
			// ...							// but best use [mep.aliases.json](#aliases)
		],
		"relations": [
			"x1",							// part of the [directive](#directive) the amendment relates to
			// ...
		],
		"text": [							// array of amendment texts in different languages (probably)
			{
				"lang": "en",				// iso-639-1 language
				"old": "xxx",				// the original text of the directive (as the amendment claims)
				"new": "yyy",				// the directive text the way the amendment wants it
				"del": ["xxx"],				// array of deleted bits of text
				"ins": ["yyy"],				// array of inserted bits of text
				"diff": "<del>xxx</del><ins>yyy</ins>", // diff with html markup
				"location": "..."			// the meps idea of a relation to the directive
			},
			// ...
		]
	}
	// ...
]
````

### Proposals

The file `proposals.json` contains proposals by [Lobbyists](#lobbyists) entities extracted from [Documents](#documents)

```` javascript
[
	{
		"uid": "e1e1d...",			// uid of the proposal
		"doc_uid": "d0c1d...",		// uid of the proposals source [Document](#documents)
		"page": "2",				// the proposals page number in the source [Document](#documents)
		"text": {
			"old": "(1) old text",	// the original text of the directive written in the [Document](#documents)
			"new": "(1) new text",	// the proposed text
			"del": ["old"],			// array of deleted bits of text
			"ins": ["new"]			// array of inserted bits of text
		},
		"diff": "<span>(1) </span><del>old</del><ins>new</ins><span> text</span>", // diff with html markup
		"relations": ["a4i1"]		// which parts of the [Directive](#directive) the proposal relates to
	},
	// ...
]
````

### Plags

_does not exist yet_

The file `plags.json` contains matches between proposals and amendments, which we call plags.

[
	{
		"uid": "91a6...",		// uid
		"relations": ["..."],	// parts of the [Directive](#directive) the plag relates to
		"amendment": "...",		// the uid of the [amendment](#amendments)
		"proposal": "...",		// the uid of the [proposal](#proposals)
		"implication": null,	// the uid of the [implication](#implications)
		"checked": true,		// is the checking process complete?
		"verified": false		// is it a valid match?
		"processing": {			// for crowdsourcing
			"propability": 0,	// propability of a match as determined by the matching algorithm
			"checks": 0,		// number of checks performed
			"positive": 0		// number of confirmative checks
		}
	},
	// ...
]

### Implications

_does not exist yet_

The file `implications.json` contains the possible outcomes of a change in the directive.

_has no structure yet_

### Documents

The file `documents.json` contains 

```` javascript
[
	{
		"uid": "9cdc...",				// an unique identifier
		"lobbyist": "accis",			// [Lobbyist](#lobbyists) id
		"imported": true,				// is the content of the document iimported to [Proposals](#proposals)
		"lang": "en",					// [Language](#languages) of the document
		"filename": "filename.pdf",		// original filename
		"mime": "application/pdf",		// mime type
		"size": 1234,					// size of the document in bytes
		"data": {						// information about the document
			"meta": {					// meta information retrieved from the file
				"title": "...",
				"author": "...",
				"subject": "...",
				"keywords": "..."
			},
			"date": {					// creation and modification dates
				"created": 1354876548,
				"modified": 1354876548
			},
			"pages": 10					// number of pages
		}
	},
	// ...
]
````

### Lobbyists

The file `lobbyists.json` contains a list of entities which have published lobby paprs

```` javascript
[
	{
		"id": "lobbyorg",		// the id of that element
		"title": "LobbyOrg",	// the name of the entity
		"url": "http://...",	// an url to the entities website
		"description": {		// desctiption texts
			"en": "...",		// iso-639-1 code ➔ text
			// ...
		},
		"relations": ["xxx"]	// ids of associated entities
	},
	// ...
]
````

### Members of the European Parliament

The file `mep.json` contains all currently active members of the European Parliament.

```` javascript
{
	"id": {						// ID (name with upper-case family names, as used by the EU)
		"name": "Name",			// Name
		"country": "de",		// [Country Code](#countries)
		"group": "ecr",			// [Group](#groups)
		"lqdn": "http://...",	// Link to LQDN Memopol or null
		"agw": "http://..."		// Link to Abgeordnetenwatch or null
	},
	// ...
}
````

#### Aliases

The file `mep.aliases.json` contains Name variants used in EU Documents and relates them to the ID in `mep.json`

```` javascript
{
	"Alias": "id",
	// ...
}
````

### Languages

The file `lang.json` contains an object of the official languages used in EU documents

```` javascript
{
	"de": "Deutsch", 	// iso-639-1 code ➔ languages own name
	// ...
}
````

### Countries

The file `countries.json` contains the country names of EU member states. Please note that Great Britain uses UK.

```` javascript
{
	"de": "Germany", 	// iso-3166-1 alpha-2 code ➔ country name (english)
	// ...
}
````

### Groups

The file `groups.json` contains the an object of groups in the EU Parliament.

```` javascript
{
	"epp": {								// id (lower-case ascii representation of short name)
		"short": "EPP",						// short name
		"long": "European People's Party",	// long name
		"mep": 271							// number of MEPs
	},
	// ...
}
````
### Committees

_does not exist yet_

The file `committees.json` will contain data about committees.

_has no structure yet_


