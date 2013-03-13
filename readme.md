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

