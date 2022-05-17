'use strict'

module.exports = Havel => {
	const { StringDecoder } = require('string_decoder');

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function toBase64
	 * @desc converts to base 64
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* toBase64() {
		const decoder = new StringDecoder('base64');
		for await (const chunk of this.iterator) {
			yield decoder.write(chunk);
		}
		yield decoder.end();
	})

	/**
	 * @function toHex
	 * @desc converts to hex string
	 * @param {Boolean} uppercase=false
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* toHex(uppercase = false) {
		const decoder = new StringDecoder('hex');
		if (uppercase) {
			for await (const chunk of this.iterator) {
				yield decoder.write(chunk).toUpperCase();
			}
			yield decoder.end().toUpperCase();
		} else {
			for await (const chunk of this.iterator) {
				yield decoder.write(chunk);
			}
			yield decoder.end();
		}
	})

	/**
	 * @function join
	 * @desc merges strings to a stream
	 * @param {String} joiner='\n'
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* join(joiner = '\n') {
		let start = true;
		for await (const chunk of this.iterator) {
			if (chunk === undefined) continue;
			if (start) {
				start = false;
				yield Buffer.from(chunk, 'utf8');
			} else {
				yield Buffer.from(joiner + chunk, 'utf8');
			}
		}
	})

	/**
	 * @function split
	 * @desc splits a stream into strings
	 * @param {RegExp} splitter=/\n/
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* split(splitter = /\n/) {
		const decoder = new StringDecoder('utf8');
		let last = '';
		for await (const chunk of this.iterator) {
			last += decoder.write(chunk)
			if (last.length < 4096) continue;

			let list = last.split(splitter);
			last = list.pop();
			for (const line of list) yield line;
		}
		last += decoder.end()
		for (const line of last.split(splitter)) yield line;
	})
}
