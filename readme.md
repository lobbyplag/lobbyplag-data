# LobbyPlag Data

This repository contains all the data [LobbyPlag](http://www.lobbyplag.eu/) is built upon.

## Raw data

The folder `raw` contains the data sources like lobby papers in arbitrary formats.

## Open Data

The folfer `data` contains the pretty and usable open data.

### Directive

The file `directive.json` contains the textual parts of the GDPR in 23 languages and in structured form.

```` javascript
[{
	"id": "h1", 		// the id of the element
	"type": "title",	// title, recital, chapter, section, article, paragraph, point or text
	"literal": null,	// the "a" in "point a)" or "I" in "Chapter I", null if none
	"parent": "_",		// the id of the parent, "_" for top level elements
	"children": [],		// an array of the ids of all children elements
	"text": {			// object contaning the texts
		"en": "...",	// key is the language
		"de": "..."		// value is the text
	}
},{
	// another element
}]
````

### Members of the European Parliament

The file `mep.json` contains all currently active members of the European Parliament.

```` javascript
{
	"id": {						// ID (name with upper-case family names, as used by the EU)
		"name": "Name",			// Name
		"country": "de",		// [Country Code](countries.json)
		"group": "ecr",			// [Group](groups.json)
		"lqdn": "http://...",	// Link to LQDN Memopol or null
		"agw": "http://..."		// Link to Abgeordnetenwatch or null
	},
	"id": {
		// ...
	}
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
	}
}
````

