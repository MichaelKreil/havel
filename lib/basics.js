'use strict'

module.exports = Havel => {
	const { Console } = require('node:console')

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function finished
	 * @desc calls a callback, when finished
	 * @param {function} cbFinished Callback that will get called
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function finished(cbFinished) {
		let iterator = this.iterator;
		if (iterator === undefined) {
			await cbFinished();
			return;
		}

		if (typeof iterator.next === 'function') {
			return (async function* () {
				yield* iterator;
				await cbFinished();
			})();
		}

		console.log('ERROR iterator', iterator);
		throw Error()
	})

	/**
	 * @function drain
	 * @desc pipes everything down the drain
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function drain() {
		// eslint-disable-next-line no-unused-vars
		for await (let entry of this.iterator) continue;
	});

	/**
	 * @function head
	 * @desc let only the first n elements through
	 * @param {Number} n=100
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* head(n = 100) {
		let i = 0;
		for await (let entry of this.iterator) {
			if (++i > n) break;
			yield entry;
		}
	});

	/**
	 * @function log
	 * @desc log all entries to the console
	 * @param {Object} options see also {@link https://nodejs.org/api/console.html#new-consoleoptions require('node:console').Console}
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* log(options = {}) {
		options.stdout ??= process.stdout;
		options.stderr ??= process.stderr;
		options.colorMode ??= true;
		let logger = new Console(options)
		for await (let entry of this.iterator) {
			logger.log(entry);
			yield entry;
		}
	});

	/**
	 * @function fromArray
	 * @desc pipe entries from an array
	 * @param {Array} array array of entries
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(function* fromArray(array) {
		if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')
		for (let entry of array) yield entry;
	});

	/**
	 * @function toArray
	 * @desc pipe entries to an array
	 * @param {Function} cbToArray callback, that will be called with the array of entries
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function toArray(cbToArray) {
		if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a callback')
		let array = [];
		for await (let entry of this.iterator) array.push(entry);
		await cbToArray(array);
	})

	/**
	 * @function map
	 * @desc like Array.map
	 * @param {Function} cbMap callback, that will be called with every entry
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* map(cbMap) {
		if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')
		let i = 0;
		for await (let entry of this.iterator) yield await cbMap(entry, i++);
	})

	/**
	 * @function forEach
	 * @desc like Array.forEach
	 * @param {Function} cbForEach callback, that will be called with every entry
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* forEach(cbForEach) {
		if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')
		let i = 0;
		for await (let entry of this.iterator) {
			await cbForEach(entry, i++)
			yield entry;
		}
	});

	/**
	 * @function forEachPairWise
	 * @desc like Array.forEach, but with pairs of entries
	 * @param {function} cbForEach - callback, that will be called with pairs of entries, like: cbForEach(a,b)
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* forEachPairWise(cbForEach) {
		let iterator = this.iterator;
		if (typeof cbForEach !== 'function') throw Error('Havel.forEachPairWise needs a function');
		while (true) {
			let a = await iterator.next();
			if (a.done) break;

			let b = await iterator.next();
			if (b.done) break;

			await cbForEach(a.value, b.value)

			yield a.value;
			yield b.value;
		}
	});
}
