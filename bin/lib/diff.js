var diff = require('diff');
var colors = require('colors');

module.exports = function(o, n, fancy) {
	
	var d = diff.diffWords(o, n);

	var result = [];
	var collect_del = [];
	var collect_ins = [];
	
	d.forEach(function(i){
		
		var t = (i.added) ? 'ins' : (i.removed) ? 'del' : 'span';
		
		if (i.value.trim().clean().split(' ').length > 1) {
			
			if (t === 'del') {
				
				if (collect_ins.length > 0) result.push('<ins>'+(collect_ins.join(''))+'</ins>');
				if (collect_del.length > 0) result.push('<del>'+(collect_del.join(''))+'</del>');
				
			} else {
				
				if (collect_del.length > 0) result.push('<del>'+(collect_del.join(''))+'</del>');
				if (collect_ins.length > 0) result.push('<ins>'+(collect_ins.join(''))+'</ins>');
				
			}
			
			collect_del = [];
			collect_ins = [];

			result.push('<'+t+'>'+(i.value)+'</'+t+'>');
			
		} else {
			
			switch (t) {
				
				case 'del':
					collect_del.push(i.value);
				break;
				case 'ins':
					collect_ins.push(i.value);
				break;
				default:
					collect_del.push(i.value);
					collect_ins.push(i.value);
				break;
				
			}
			
		}
		
	});
	
	if (collect_del.length > 0) result.push('<del>'+(collect_del.join(''))+'</del>');
	if (collect_ins.length > 0) result.push('<ins>'+(collect_ins.join(''))+'</ins>');
	
	// second pass
	
	var combined = [];
	var combined_ins = [];
	var combined_del = [];
	
	result.forEach(function(r){
		
		var t = r.match(/^<(span|ins|del)>/).pop();

		switch (t) {
			
			case 'span':
			
				if (combined_del.length > 0) combined.push(combined_del.join(''));
				if (combined_ins.length > 0) combined.push(combined_ins.join(''));
				
				combined_del = [];
				combined_ins = [];
				
				combined.push(r);
				
			break;
			case 'ins':
				combined_ins.push(r);
			break;
			case 'del':
				combined_del.push(r);
			break;
			
		}
		
	});
	
	if (combined_del.length > 0) combined.push(combined_del.join(''));
	if (combined_ins.length > 0) combined.push(combined_ins.join(''));
	
	result = combined.join('');

	result = result.replace(/<\/ins><ins>/g,'');
	result = result.replace(/<\/del><del>/g,'');
	result = result.replace(/<\/span><span>/g,'');

	// result = result.replace(/<\/span><span>/g,'');

	if (fancy) {
	
		result = result.replace(/<span>([^<]+)<\/span>/g, function(d){
			return d.replace(/<span>([^<]+)<\/span>/g, '$1').black;
		});
		result = result.replace(/<ins>([^<]+)<\/ins>/g, function(d){
			return d.replace(/<ins>([^<]+)<\/ins>/g, '$1').green;
		});
		result = result.replace(/<del>([^<]+)<\/del>/g, function(d){
			return d.replace(/<del>([^<]+)<\/del>/g, '$1').red;
		});
		
	}

	return result;
	
}

String.prototype.trim = function(){
	return this.replace(/^\s+|\s+$/g, '');
}; 

String.prototype.clean = function(){
	return this.replace(/\s+/g, ' ');
};