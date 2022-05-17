'use strict'

module.exports = Havel => {
	const { Console } = require('console')

	async function finished(cb) {
		let iterator = await this.iterator;
		//console.log('finished', iterator);
		
		if (iterator === undefined) {
			cb();
			return;
		}

		if (typeof iterator.next === 'function') {
			return (async function* () {
				yield* iterator;
				await cb();
			})();
		}

		console.log('ERROR iterator', iterator);
		throw Error()
	}
	Havel.registerNodeFactory('finished', finished)

	/**
	 * @function drain
	 * pipes everything in the sink
	 */
	async function drain() {
		let iterator = await this.iterator;
		while (true) {
			if ((await iterator.next()).done) break;
		}
	}
	Havel.registerNodeFactoryFunction(drain);

	/**
	 * @function head
	 * Let only the first n entries through.
	 * @param {number} [n=100] - optional number of entries
	 */
	async function* head(n=100) {
		let i = 0;
		for await (let entry of await this.iterator) {
			if (++i > n) break;
			yield entry;
		}
	}
	Havel.registerNodeFactoryFunction(head);

	/**
	 * @function log
	 * Log entries
	 * @param {Object} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	async function* log(options) {
		options ??= {};
		options.stdout ??= process.stdout;
		options.stderr ??= process.stderr;
		options.colorMode ??= true;
		let logger = new Console(options)
		for await (let entry of await this.iterator) {
			logger.log(entry);
			yield entry;
		}
	}
	Havel.registerNodeFactoryFunction(log);

	/**
	 * @function fromArray
	 * Log entries
	 * @param {Array} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	async function* fromArray(array) {
		if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')
		for await (let entry of array) yield entry;
	}
	Havel.registerNodeFactoryFunction(fromArray);

	async function toArray(cbToArray) {
		if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a callback')
		let array = [];
		for await (let entry of await this.iterator) array.push(entry);
		await cbToArray(array);
	}
	Havel.registerNodeFactoryFunction(toArray);

	async function* map(cbMap) {
		if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')
		let i = 0;
		for await (let entry of await this.iterator) yield await cbMap(entry, i++);
	}
	Havel.registerNodeFactoryFunction(map);

	async function* each(cbEach) {
		if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')
		let i = 0;
		for await (let entry of await this.iterator) {
			await cbEach(entry, i++)
			yield entry;
		}
	}
	Havel.registerNodeFactoryFunction(each);

	async function* eachPairWise(cbPairWise) {
		let iterator = await this.iterator;
		if (typeof cbPairWise !== 'function') throw Error('Havel.eachPairWise needs a function');
		while (true) {
			let a = await iterator.next();
			if (a.done) break;

			let b = await iterator.next();
			if (b.done) break;

			await cbPairWise(a.value, b.value)

			yield a.value;
			yield b.value;
		}
	}
	Havel.registerNodeFactoryFunction(eachPairWise);
}
