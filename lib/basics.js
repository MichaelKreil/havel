"use strict"

module.exports = Havel => {
	const Stream = require('stream');

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

	function log() {
		return Havel.Transform({
			transform: entry => {
				console.log(entry);
				return entry;
			},
		 	name:'log'
		 });
	}

	function toArray(cb) {
		let array = [];
		return Havel(new Stream.Writable({
			objectMode: true,
			write: (entry, enc, cb) => {
				array.push(entry);
				cb()
			},
		}), { inputType:'object', outputType:'nothing', name:'toArray' });
	}

	function fromArray(array) {
		return Havel(Stream.Readable.from(array), { inputType:'nothing', outputType:'object', name:'fromArray' });
	}

	function map(cbMap, opt = {}) {
		opt.name ??= 'map';
		let i = 0;
		opt.transform = async entry => await cbMap(entry, i++);
		return Havel.Transform(opt);
	}

	function each(cbEach, opt = {})
		opt.name ??= 'each';
		let i = 0;
		opt.transform = async (entry, write) => { write(entry); await cbEach(entry, i++) }
		return Havel.Transform(opt);
	}

	function eachPairWise(cbPairWise) {
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
