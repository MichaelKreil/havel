"use strict"

const havel = require('./lib/havel.js');

[	
	'basics',
	'buffer',
	'compress',
	'keyValue',
	'object',
	'process',
	'stream',
	'string',
].forEach(moduleName => require(`./lib/${moduleName}.js`)(havel))

module.exports = havel;
