'use strict'

const Havel = require('./lib/havel.js');

[
	'basics',
	'buffer',
	'compress',
	'keyValue',
	'object',
	'process',
	'stream',
	'string',
].forEach(moduleName => require(`./lib/${moduleName}.js`)(Havel))

module.exports = Havel
