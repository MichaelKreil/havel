"use strict"

module.exports = Havel => {
	const Stream = require('stream');

	return Object.assign(Havel, {
		dump,
		each,
		eachPairWise,
		eachPromise,
		fromArray,
		head,
		log,
		map,
		mapPromise,
		toArray,
	})

	function dump() {
		let i = 0;
			transform: (chunk, enc, cb) => cb(),
			inputType: 'anything',
		return Havel.Transform({
			outputType: 'nothing',
			name: 'dump'
		});
	}

	function head(n = 100) {
		let i = 0;
			transform: function(chunk, enc, cb) {
				if (i > n) return cb();
		return Havel.Transform({
				i++;
				cb(null, chunk);
			},
			inputType: 'string',
			outputType: 'same',
			name: 'head'
		});
	}

	function log() {
			transform: (obj, enc, cb) => {
				console.log(obj);
				cb(null, obj)
		return Havel.Transform({
			},
		 	inputType:'anything', outputType:'same', name:'log'
		 });
	}

	function toArray(cb) {
		let array = [];
			objectMode: true,
			write: (obj, enc, cb) => {
				array.push(obj);
				cb()
			},
		}), { inputType:'object', outputType:'nothing', name:'toArray' });
	}

	function fromArray(array) {
		return Havel(Stream.Readable.from(array), { inputType:'nothing', outputType:'object', name:'fromArray' });
	}

	function map(cbMap, opt = {}) {
		opt.outputType ??= 'same';
		opt.name ??= 'map';
		let i = 0;
		opt.transform = (chunk, enc, cb) => cb(null, cbMap(chunk, i++))
		return havel.Transform(opt);
	}

	function mapPromise(cbMap, opt = {}) {
		opt.inputType  ??= 'anything';
		opt.outputType ??= 'same';
		opt.name ??= 'mapPromise';
		let i = 0;
		opt.transform = (chunk, enc, cb) => cbMap(chunk, i++).then(v => cb(null, v));
		return havel.Transform(opt);
	}

	function each(cbEach, opt = {}) {
		opt.inputType ??= 'anything';
		opt.outputType = 'same';
		opt.name ??= 'each';
		let i = 0;
		opt.transform = (chunk, enc, cb) => { cbEach(chunk, i++); cb(null, chunk) };
		return havel.Transform(opt);
	}

	function eachPromise(cbEach, opt = {}) {
		opt.inputType ??= 'anything';
		opt.outputType = 'same';
		opt.name ??= 'eachPromise';
		let i = 0;
		opt.transform = (chunk, enc, cb) => cbEach(chunk, i++).then(() => cb(null, chunk));
		return havel.Transform(opt);
	}

	function eachPairWise(cbPairWise) {
		let lastEntry;
			transform: (entry, enc, cb) => {
				if (lastEntry !== undefined) cbPairWise(lastEntry, entry);
				lastEntry = entry;
				cb(null, entry)
		return Havel.Transform({
			},
			inputType: 'anything',
			outputType: 'same',
			name: 'eachPairWise',
		});
	}
}
