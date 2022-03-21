"use strict"

module.exports = Havel => {
	const Stream = require('stream');
	const util = require('util');
	const { Console } = require('console');

	return Object.assign(Havel, {
		dump,
		each,
		eachPairWise,
		fromArray,
		head,
		log,
		map,
		toArray,
	})

	function dump() {
		return Havel({
			func: async function dump(iterator) {
				for await (let entry of iterator) {}
				this.finish();
			},
			outputType: 'nothing',
			name: 'dump'
		});
	}

	function head(n = 100) {
		let i = 0;
		return Havel({
			func: async function* head(iterator) {
				for await (let entry of iterator) {
					if (++i > n) return;
					yield entry;
				}
				this.finish();
			},
			name: 'head'
		});
	}

	function log(stream) {
		let logger = new Console({ stdout:stream ?? process.stdout })
		return Havel({
			func: async function* log(iterator) {
				for await (let entry of iterator) {
					logger.log(entry);
					yield entry;
				}
				this.finish();
			},
		 	name:'log'
		 });
	}

	function fromArray(array, opt) {
		if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')

		return Havel({
			func: function* fromArray() {
				for (let entry of array) {
					yield entry;
				}
				this.finish();
			},
			inputType:'nothing',
			outputType:opt?.outputType ?? Havel.detectType(array[0]),
			name:'fromArray'
		});
	}

	function toArray(cbToArray) {
		if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a function')

		let array = [];
		return Havel({
			func: async function toArray(iterator) {
				for await (let entry of iterator) array.push(entry);
				await cbToArray(array);
				this.finish();
			},
			inputType:'anything',
			outputType:'nothing',
			name:'toArray'
		});
	}

	function map(cbMap) {
		if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')
		let i = 0;
		return Havel({
			func: async function* map(iterator) {
				for await (let entry of iterator) {
					yield await cbMap(entry, i++);
				}
				this.finish();
			},
			name:'map',
		});
	}

	function each(cbEach, opt = {}) {
		if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')
		let i = 0;
		return Havel({
			func: async function* each(iterator) {
				for await (let entry of iterator) {
					await cbEach(entry, i++)
					yield entry;
				}
				this.finish();
			},
			name: 'each',
		});
	}

	function eachPairWise(cbPairWise) {
		if (typeof cbPairWise !== 'function') throw Error('Havel.eachPairWise needs a function')

		let lastEntry;
		return Havel({
			func: async function* eachPairWise(iterator) {
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
			},
			name: 'eachPairWise',
		});
	}
}
