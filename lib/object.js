"use strict"

module.exports = Havel => {
	const v8 = require('v8');

	return Object.assign(Havel, {
		objectToJSON,
		JSONToObject,
		serializeObject,
		deserializeObject,
	})

	function objectToJSON() {
		return Havel({
			func: async function* objectToJSON(iterator) {
				for await (const obj of iterator) {
					yield JSON.stringify(obj);
				}
				this.finish();
			},
			inputType: 'object',
			outputType: 'string',
			name: 'objectToJSON',
		});
	}

	function JSONToObject() {
		return Havel({
			func: async function* JSONToObject(iterator) {
				for await (const text of iterator) {
					yield JSON.parse(text);
				}
				this.finish();
			},
			inputType: 'string',
			outputType: 'object',
			name: 'JSONToObject',
		});
	}

	function serializeObject() {
		return Havel({
			func: async function* serializeObject(iterator) {
				for await (const obj of iterator) {
					yield v8.serialize(obj);
				}
				this.finish();
			},
			inputType: 'object',
			outputType: 'buffer',
			name: 'serializeObject',
		});
	}

	function deserializeObject() {
		return Havel({
			func: async function* deserializeObject(iterator) {
				for await (const buffer of iterator) {
					yield v8.deserialize(buffer);
				}
				this.finish();
			},
			inputType: 'buffer',
			outputType: 'object',
			name: 'deserializeObject',
		});
	}
}
