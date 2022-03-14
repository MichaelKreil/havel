"use strict"

const Stream = require('stream');

module.exports = {
	compose,
	pipeline,
	toArray,
	fromArray,
	each,
	map,
	log,
	Transform,
	wrapStream,
}

function log() {
	return wrapStream(process.stdout, {inputType:'string',outputType:'none'})
}

function toArray(cb) {
	let array = [];
	return Object.assign(new Stream.Writable({
		objectMode:true,
		write: (obj, enc, cb) => {
			array.push(obj);
			cb()
		},
	}), { inputType:'object', outputType:'none' });
}

function fromArray(array) {
	let stream = Stream.Readable.from(array);
	stream.inputType = 'none';
	stream.outputType = 'object';
	return stream;
}

function map(cbMap, opt = {}) {
	if (!opt.type && (!opt.inputType || !opt.outputType)) throw Error('need in/output type for map');
	let i = 0;
	if (opt.async) {
		opt.transform = (chunk, enc, cb) => cbMap(chunk, i++).then(v => cb(null, v));
	} else {
		opt.transform = (chunk, enc, cb) => cb(null, cbMap(chunk, i++));
	}
	return new Transform(opt);
}

function each(cbEach, opt = {}) {
	if (!opt.type && !opt.inputType) throw Error('need input type for each');
	opt.outputType = 'none';
	let i = 0;
	if (opt.async) {
		opt.transform = (chunk, enc, cb) => cbEach(chunk, i++).then(() => cb());
	} else {
		opt.transform = (chunk, enc, cb) => { cbEach(chunk, i++); cb() };
	}
	return new Transform(opt);
}

function pipeline() {
	let streams = Array.from(arguments);
	let cbFinished;
	if (typeof streams[streams.length-1] === 'function') cbFinished = streams.pop();
	let stream = compose(...streams);
	if (cbFinished) stream.once('finish', cbFinished);
}

function compose() {
	let streams = Array.from(arguments);

	for (let i = 0; i < streams.length-1; i++) {
		let s0 = streams[i];
		let s1 = streams[i+1];
		if (s0.outputType !== s1.inputType) {
			throw Error(`types mismatch:\n\tstream${i}.outputType (${s0.outputType})\n\t!==\n\tstream${i+1}.inputType (${s1.inputType})`)
		}
	}

	let stream = Stream.compose(...streams);
	stream.inputType  = streams[0               ].inputType;
	stream.outputType = streams[streams.length-1].outputType;

	return stream;
}

function Transform(opt) {
	if (typeof opt.transform !== 'function') throw Error('transform function must be defined');

	let parameters = {
		objectMode: true,
		autoDestroy: true,
		transform: opt.transform,
	}
	if (opt.flush) parameters.flush = opt.flush;

	let stream = new Stream.Transform(parameters);

	return wrapStream(stream, opt);
}

function wrapStream(stream, opt) {

	stream.inputType  = opt.type || opt.inputType;
	stream.outputType = opt.type || opt.outputType;

	checkType('input',  stream.inputType);
	checkType('output', stream.outputType);

	return stream;

	function checkType(name, type) {
		switch (type) {
			case 'keyValue':
			case 'none':
			case 'buffer':
			case 'object':
			case 'stream':
			case 'string':
				return;
			default: throw Error(`unknown type "${type}" for "${name}"`)
		}
	}
}
