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
		return Havel.Transform({
			transform: obj => JSON.stringify(obj),
			inputType: 'object',
			outputType: 'string',
			name: 'objectToJSON',
		});
	}

	function JSONToObject() {
		return Havel.Transform({
			transform: text => JSON.parse(text),
			inputType: 'string',
			outputType: 'object',
			name: 'JSONToObject',
		});
	}

	function serializeObject() {
		return Havel.Transform({
			transform: obj => v8.serialize(obj),
			inputType: 'object',
			outputType: 'buffer',
			name: 'serializeObject',
		});
	}

	function deserializeObject() {
		return Havel.Transform({
			transform: buffer => v8.deserialize(buffer),
			inputType: 'buffer',
			outputType: 'object',
			name: 'deserializeObject',
		});
	}
}
