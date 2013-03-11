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
	"children": [],	// an array of the ids of all children elements
	"text": {			// object contaning the texts
		"en": "...",	// key is the language
		"de": "..."		// value is the text
	}
},{
	// another element
}]
````

### Countries

The file `countries.json` contains the country names of EU member states.

### Groups

The file `groups.json` contains the an object of groups in the EU Parliament.
