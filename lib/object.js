"use strict"

module.exports = Havel => {

	return Object.assign(Havel, {
		objectToJSON,
		JSONToObject,
	})

	function objectToJSON() {
		return Havel.Transform({
			transform: (obj, enc, cb) => cb(null, JSON.stringify(obj)),
			inputType: 'object',
			outputType: 'string',
			name: 'objectToJSON',
		});
	}

	function JSONToObject() {
		return Havel.Transform({
			transform: (text, enc, cb) => cb(null, JSON.parse(text)),
			inputType: 'string',
			outputType: 'object',
			name: 'JSONToObject',
		});
	}
}
