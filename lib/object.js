"use strict"

module.exports = havel => {
	
	return Object.assign(havel, {
		objectToJSON,
		JSONToObject,
	})

	function objectToJSON() {
		return havel.Transform({
			transform: (obj, enc, cb) => cb(null, JSON.stringify(obj)),
			inputType: 'object',
			outputType: 'string',
			name: 'objectToJSON',
		});
	}

	function JSONToObject() {
		return havel.Transform({
			transform: (text, enc, cb) => cb(null, JSON.parse(text)),
			inputType: 'string',
			outputType: 'object',
			name: 'JSONToObject',
		});
	}
}
