'use strict'

module.exports = Havel => {
	const { Console } = require('console')

	/**
	 * @function drain
	 * pipes everything in the sink
	 */
	Havel.registerNode('drain', () => Havel.wrapFunc({
		func: async function drain(iterator) {
			while (true) {
				if ((await iterator.next()).done) break;
			}
			this.finish();
		},
		outputType: 'nothing'
	}))

	/**
	 * @function head
	 * Let only the first n entries through.
	 * @param {number} [n=100] - optional number of entries
	 */
	Havel.registerNode('head', (n=100) => Havel.wrapFunc({
		func: async function* head(iterator) {
			let i = 0;
			for await (let entry of iterator) {
				if (++i > n) break;
				yield entry;
			}
			this.finish();
		}
	}))

	/**
	 * @function log
	 * Log entries
	 * @param {Object} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	Havel.registerNode('log', options => Havel.wrapFunc({
		func: async function* log(iterator) {
			let logger = new Console(options)
			for await (let entry of iterator) {
				logger.log(entry);
				yield entry;
			}
			this.finish();
		}
	}))

	/**
	 * @function fromArray
	 * Log entries
	 * @param {Array} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 * @param {Object} [options=] - options from https://nodejs.org/api/console.html#new-consoleoptions
	 */
	Havel.registerNode('fromArray', (array, outputType) => Havel.wrapFunc({
		func: function* fromArray() {
			if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')
			for (let entry of array) yield entry;
			this.finish();
		},
		inputType: 'nothing',
		outputType: outputType ?? Havel.detectType(array[0])
	}))

	Havel.registerNode('toArray', (cbToArray) => Havel.wrapFunc({
		func: async function toArray(iterator) {
			if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a function')
			let array = [];
			for await (let entry of iterator) array.push(entry);
			await cbToArray(array);
			this.finish();
		},
		outputType:'nothing'
	}))

	Havel.registerNode('map', (cbMap) => Havel.wrapFunc({
		func: async function* map(iterator) {
			if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')
			let i = 0;
			for await (let entry of iterator) yield await cbMap(entry, i++);
			this.finish();
		}
	}))

	Havel.registerNode('each', (cbEach) => Havel.wrapFunc({
		func: async function* each(iterator) {
			if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')
			let i = 0;
			for await (let entry of iterator) {
				await cbEach(entry, i++)
				yield entry;
			}
			this.finish();
		}
	}))

	Havel.registerNode('eachPairWise', (cbPairWise) => Havel.wrapFunc({
		func: async function* eachPairWise(iterator) {
			if (typeof cbPairWise !== 'function') throw Error('Havel.eachPairWise needs a function');
			while (true) {
				let a = await iterator.next();
				if (a.done) break;
				yield a.value;

				let b = await iterator.next();
				if (b.done) break;
				yield b.value;

				await cbPairWise(a, b)
			}
			this.finish();
		}
	}))
}
