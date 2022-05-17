'use strict'

module.exports = Havel => {
	const v8 = require('v8');

	async function* objectToJSON() {
		for await (const obj of this.iterator) yield JSON.stringify(obj);
	}
	Havel.registerNodeFactoryFunction(objectToJSON);

	async function* JSONToObject() {
		for await (const text of this.iterator) yield JSON.parse(text);
	}
	Havel.registerNodeFactoryFunction(JSONToObject);

	async function* serializeObject() {
		for await (const obj of this.iterator) yield v8.serialize(obj);
	}
	Havel.registerNodeFactoryFunction(serializeObject);

	async function* deserializeObject() {
		for await (const buffer of this.iterator) yield v8.deserialize(buffer);
	}
	Havel.registerNodeFactoryFunction(deserializeObject);
}
