'use strict'

module.exports = Havel => {
	const v8 = require('v8');

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function objectToJSON
	 * @desc serializes objects to JSON
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* objectToJSON() {
		for await (const obj of this.iterator) yield JSON.stringify(obj);
	})

	/**
	 * @function JSONToObject
	 * @desc deserializes JSON to objects
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* JSONToObject() {
		for await (const text of this.iterator) yield JSON.parse(text);
	})

	/**
	 * @function serializeObject
	 * @desc serializes objects
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* serializeObject() {
		for await (const obj of this.iterator) yield v8.serialize(obj);
	})

	/**
	 * @function deserializeObject
	 * @desc deserializes objects
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* deserializeObject() {
		for await (const buffer of this.iterator) yield v8.deserialize(buffer);
	})
}
