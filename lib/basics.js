"use strict"

module.exports = havel => {
	const Stream = require('stream');
	
	return Object.assign(havel, {
		each,
		eachPromise,
		fromArray,
		head,
		log,
		map,
		mapPromise,
		pairWise,
		toArray,
	})

	function head(n = 100) {
		let i = 0;
		return havel.Transform({
			transform: function (chunk, enc, cb) {
				if (i > n) return cb();
				i++;
				cb(null, chunk);
			},
			inputType:'string',
			outputType:'same',
			name:'head'
		});
	}

	function log() {
		return havel(new Stream.Writable({
			objectMode:true,
			write: (obj, enc, cb) => {
				if (!obj.toString) {
					console.log(obj);
					return cb();
				}
				let value = obj.toString();
				if (value.then) {
					value.then(v => {
						console.log(v);
						cb();
					})
					return
				}
				console.log(value);
				cb()
			},
		}), { inputType:'anything', outputType:'none', name:'log' });
	}

	function toArray(cb) {
		let array = [];
		return havel(new Stream.Writable({
			objectMode:true,
			write: (obj, enc, cb) => {
				array.push(obj);
				cb()
			},
		}), { inputType:'object', outputType:'none', name:'toArray' });
	}

	function fromArray(array) {
		return havel(Stream.Readable.from(array), { inputType:'none', outputType:'object', name:'fromArray' });
	}

	function map(cbMap, opt = {}) {
		opt.inputType  ??= 'anything';
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
		opt.outputType = 'none';
		opt.name ??= 'each';
		let i = 0;
		opt.transform = (chunk, enc, cb) => { cbEach(chunk, i++); cb() };
		return havel.Transform(opt);
	}

	function eachPromise(cbEach, opt = {}) {
		opt.inputType ??= 'anything';
		opt.outputType = 'none';
		opt.name ??= 'eachPromise';
		let i = 0;
		opt.transform = (chunk, enc, cb) => cbEach(chunk, i++).then(() => cb());
		return havel.Transform(opt);
	}

	function pairWise(cbPairWise) {
		let lastEntry;
		return havel.Transform({
			transform: (entry, enc, cb) => {
				if (lastEntry !== undefined) cbPairWise(lastEntry, entry);
				lastEntry = entry;
				cb(null, KeyValue(entry))
			},
			inputType: 'anything',
			outputType: 'same',
			name: 'pairWise',
		});
	}
}
