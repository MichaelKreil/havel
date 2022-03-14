"use strict"

const havel = require('./lib/basics.js');

[
	'buffer',
	'compress',
	'keyValue',
	'object',
	'process',
	'stream',
	'string',
].forEach(moduleName => require(`./lib/${moduleName}.js`)(havel))

module.exports = havel;
