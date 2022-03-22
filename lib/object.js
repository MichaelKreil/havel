"use strict"

module.exports = Havel => {
	const v8 = require('v8');

	Havel.registerNode('objectToJSON', () => Havel.wrapFunc({
		func: async function* objectToJSON(iterator) {
			for await (const obj of iterator) yield JSON.stringify(obj);
			this.finish();
		},
		inputType: 'object',
		outputType: 'string',
	}))

	Havel.registerNode('JSONToObject', () => Havel.wrapFunc({
		func: async function* JSONToObject(iterator) {
			for await (const text of iterator) yield JSON.parse(text);
			this.finish();
		},
		inputType: 'string',
		outputType: 'object',
	}))

	Havel.registerNode('serializeObject', () => Havel.wrapFunc({
		func: async function* serializeObject(iterator) {
			for await (const obj of iterator) yield v8.serialize(obj);
			this.finish();
		},
		inputType: 'object',
		outputType: 'buffer',
	}))

	Havel.registerNode('deserializeObject', () => Havel.wrapFunc({
		func: async function* deserializeObject(iterator) {
			for await (const buffer of iterator) yield v8.deserialize(buffer);
			this.finish();
		},
		inputType: 'buffer',
		outputType: 'object',
	}))
}
