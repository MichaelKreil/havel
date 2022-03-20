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
		let i = 0;
		return Havel.Transform({
			transform: () => {},
			outputType: 'nothing',
			name: 'dump'
		});
	}

	function head(n = 100) {
		let i = 0;
		return Havel.Transform({
			transform: entry => {
				if (i >= n) return;
				i++;
				return entry;
			},
			name: 'head'
		});
	}

	function log(stream) {
		let logger = new Console({ stdout:stream ?? process.stdout })
		return Havel.Transform({
			transform: (entry, write) => {
				write(entry);
				logger.log(entry);
			},
		 	name:'log'
		 });
	}

	function fromArray(array) {
		if (!Array.isArray(array)) throw Error('Havel.fromArray needs an array')

		return Havel(
			Stream.Readable.from(array),
			{
				inputType:'nothing',
				outputType:Havel.detectType(array[0]),
				name:'fromArray'
			}
		);
	}

	function toArray(cbToArray) {
		if (typeof cbToArray !== 'function') throw Error('Havel.toArray needs a function')

		let array = [];
		let stream = new Stream.Writable({ objectMode: true,
			write: (entry, enc, cb) => { array.push(entry); cb() }
		})
		stream.on('finish', () => cbToArray(array));
		return Havel(
			stream,
			{
				inputType:'anything',
				outputType:'nothing',
				name:'toArray'
			}
		);
	}

	function map(cbMap, opt = {}) {
		if (typeof cbMap !== 'function') throw Error('Havel.map needs a function')

		opt.name ??= 'map';
		let i = 0;
		opt.transform = async entry => await cbMap(entry, i++);
		return Havel.Transform(opt);
	}

	function each(cbEach, opt = {}) {
		if (typeof cbEach !== 'function') throw Error('Havel.each needs a function')

		opt.name ??= 'each';
		let i = 0;
		opt.transform = async (entry, write) => { write(entry); await cbEach(entry, i++) }
		return Havel.Transform(opt);
	}

	function eachPairWise(cbPairWise) {
		if (typeof cbPairWise !== 'function') throw Error('Havel.eachPairWise needs a function')

		let lastEntry;
		return Havel.Transform({
			transform: async entry => {
				if (lastEntry !== undefined) await cbPairWise(lastEntry, entry);
				return lastEntry = entry;
			},
			name: 'eachPairWise',
		});
	}
}
