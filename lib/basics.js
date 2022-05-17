'use strict'

module.exports = Havel => {
	const { Console } = require('console')

	Havel.registerNodeFactoryFunction(async function finished(cb) {
		let iterator = this.iterator;
		if (iterator === undefined) {
			await cb();
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
	})

	/**
	 * @function drain
	 * pipes everything in the sink
	 */
	Havel.registerNodeFactoryFunction(async function drain() {
		for await (let entry of this.iterator) continue;
	});

	/**
	 * @function head
	 * Let only the first n entries through.
	 * @param {number} [n=100] - optional number of entries
	 */
	Havel.registerNodeFactoryFunction(async function* head(n=100) {
		let i = 0;
		for await (let entry of this.iterator) {
			if (++i > n) break;
			yield entry;
		}
	});

	/**
	 * @function log
	 * Log entries
	 * @param {Object} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	Havel.registerNodeFactoryFunction(async function* log(opt = {}) {
		opt.stdout ??= process.stdout;
		opt.stderr ??= process.stderr;
		opt.colorMode ??= true;
		let logger = new Console(opt)
		for await (let entry of this.iterator) {
			logger.log(entry);
			yield entry;
		}
	});

	/**
	 * @function fromArray
	 * Log entries
	 * @param {Array} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	Havel.registerNodeFactoryFunction(function* fromArray(array) {
		if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')
		for (let entry of array) yield entry;
	});

	Havel.registerNodeFactoryFunction(async function toArray(cbToArray) {
		if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a callback')
		let array = [];
		for await (let entry of this.iterator) array.push(entry);
		await cbToArray(array);
	})

	Havel.registerNodeFactoryFunction(async function* map(cbMap) {
		if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')
		let i = 0;
		for await (let entry of this.iterator) yield await cbMap(entry, i++);
	})

	Havel.registerNodeFactoryFunction(async function* each(cbEach) {
		if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')
		let i = 0;
		for await (let entry of this.iterator) {
			await cbEach(entry, i++)
			yield entry;
		}
	});

	Havel.registerNodeFactoryFunction(async function* eachPairWise(cbPairWise) {
		let iterator = this.iterator;
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
	});
}
