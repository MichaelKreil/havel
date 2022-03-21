"use strict"

const os = require('os');
const allowedTypes = new Set('keyValue,nothing,buffer,object,string,stream'.split(','));
const Havel = wrapNode;
const { EventEmitter } = require('events');

Object.assign(Havel, {
	compose,
	pipeline,
	detectType,
	wrapStream,
})

module.exports = Havel;

process.on('unhandledRejection', (error, promise) => {
	throw error;
});

function pipeline(nodes, cbFinished) {
	if (!Array.isArray(nodes)) throw Error('pipeline needs an array of nodes')

	let pipeline = compose(nodes);
	let lineUp = getNodeLineUp(pipeline);
	if (cbFinished) {
		if (typeof cbFinished !== 'function') throw Error('pipeline finish callback must be a function')
		lineUp[lineUp.length-1].on('finished', cbFinished);
	}

	try {

		// the core of all the piping magic
		let lastNode;
		for (let node of lineUp) {
			let type = lastNode?.getOutputType() ?? 'nothing';
			node.setInputType(type);
			node.iter = node.func(lastNode?.iter);
			lastNode = node;
		}
		blackHole(lastNode.iter);

	} catch (e) {
		console.log('ERRORR');
		if (!e.logged) logPipeline(pipeline);
		e.logged = true;
		throw e;
	}

	function getNodeLineUp(node) {
		let lineUp = [];
		try {
			rec(node)
		} catch (e) {
			if (!e.logged) console.dir(node);
			e.logged = true;
			throw e;
		}
		return lineUp;

		function rec(node) {
			switch (node.type) {
				case 'line': return node.nodes.forEach(n => rec(n));
				case 'node': return lineUp.push(node);
				default:
					throw Error(`unknown node type: ${node.type}`);
			}
		}
	}
}

function pipelineToString(node, highlightNode) {

	let result = [];
	rec(node, 0);
	return result.join('\n');

	function rec(node, depth) {
		let prefix = '  '.repeat(depth);
		if (node.type === 'node') {
			let msg = (node.name ?? 'unnamed');
			if (node === highlightNode) msg = "\x1b[1m"+msg+" <===\x1b[0m"
			result.push(prefix + msg);
			return
		}
		if (node.type === 'line') {
			let msg = (node.name ?? 'unnamed')+' [';
			if (node === highlightNode) msg = "\x1b[1m"+msg+" <===\x1b[0m"
			result.push(prefix + msg);
			node.nodes.forEach(n => rec(n, depth + 1));
			result.push(prefix + ']');
			return
		}
		result.push('  '.repeat(depth) + "\x1b[1mUNKNOWN NODE TYPE <===\x1b[0m");
	}
}

function compose(nodes, name = 'pipeline') {
	if (!Array.isArray(nodes)) throw Error('compose needs an array of nodes')

	let line = { type:'line', nodes, name };
	nodes.forEach(node => node.parent = line);
	return line;
}
/*
function Transform(opt = {}) {
	opt.inputType  ??= 'anything';
	opt.outputType ??= 'same';

	let transform = opt.transform;

	if (typeof transform !== 'function') throw Error('transform function must be defined');

	const parameters = {
		transform: async function(chunk, encoding, cbTransform) {
			let result = await transform(chunk, result => write(result));
			if ((result !== null) && (result !== undefined)) write(result);
			cbTransform();
		},
		allowHalfOpen: false,
		readable: true,
		writeable: true,
		objectMode: opt.outputType !== 'stream',
		highWaterMark: (opt.inputType === 'stream') ? 1024*1024 : 16,
	}

	if (opt.flush) {
		let flush = opt.flush;
		if (typeof flush !== 'function') throw Error('flush must be a function');
		parameters.flush = async function(cbFlush) {
			let result = await flush(result => write(result));
			if ((result !== null) && (result !== undefined)) write(result);
			cbFlush();
		}
	}

	const stream = new Stream.Transform(parameters);
	const write = data => stream.push(data);

	return Havel(stream, opt);
}*/

function wrapStream(stream, opt) {
	opt.func = function (iterator) {

		if (typeof stream._write === 'function') {
			async function wrapStreamIn() {
				for await (let chunk of iterator) {
					if (stream.write(chunk)) continue;
					await new Promise(res => stream.once('drain', res));
				}
				stream.end();
			}

			wrapStreamIn();
		}


		let me = this;
		if (typeof stream._read === 'function') {
			return (async function* wrapStreamOut() {
				for await (let chunk of stream) yield chunk;
				me.finish();
			})()
		} else {
			stream.on('finish', () => me.finish());
			return false;
		}
	}
	return new HavelNode(opt);
}

function wrapNode(opt) {
	if (!opt) throw Error('wrapNode needs parameters');
	return new HavelNode(opt);
}

class HavelNode extends EventEmitter {
	constructor(opt) {
		super();

		this._type = 'node';
		this.func = opt.func;
		this.name = opt.name ?? '?';
		this. inputTypeDef =  opt.inputType ?? opt.type ?? 'anything';
		this.outputTypeDef = opt.outputType ?? opt.type ?? 'same';

		if (!this.func) throw Error('wrapNode needs a func as parameter');
		if (typeof this.func !== 'function') throw Error('wrapNode needs as func a function');
		switch (this.func.constructor.name) {
			case 'AsyncGeneratorFunction':
			case 'AsyncFunction':
			case 'GeneratorFunction':
			case 'Function':
				break;
			default:
				throw Error(`wrapNode needs as func an (Async)(Generator)Function, and not "${this.func.constructor.name}"`)
		}
	}
	get type() {
		return this._type;
	}
	finish() {
		this.emit('finished');
	}
	setInputType(type) {
		if (!allowedTypes.has(type)) throw Error(`type ${type} is not allowed`);
		if ( this.inputTypeDef === type) return this.inputType = type;
		if ( this.inputTypeDef === 'anything') return this.inputType = type;
		if ((this.inputTypeDef === 'stream') && (type === 'buffer')) return this.inputType = 'stream';
		throw Error(`can't handle inputTypeDef "${this.inputTypeDef}" with type "${type}"`);
	}
	getOutputType() {
		this.outputType = this.outputTypeDef;
		if (this.outputType === 'same') this.outputType = this.inputType;
		if (typeof this.outputType === 'function') this.outputType = this.outputType(this.inputType);
		if (allowedTypes.has(this.outputType)) return this.outputType;
		throw Error(`can't handle outputTypeDef "${this.outputTypeDef}"`);
	}
}

function logPipeline(node) {
	let root = node;
	while (root.parent) root = root.parent;
	console.log(pipelineToString(root, node))
}

function detectType(obj) {
	switch (typeof obj) {
		case 'object':
			if (Buffer.isBuffer(obj)) return 'buffer';
			if (obj instanceof Havel.KeyValue) return 'keyValue';
			return 'object';
		case 'number': return 'object';
		case 'string': return 'string';
	}
	throw Error('unknown type '+(typeof obj));
}

async function blackHole(stuff) {
	while (true) {
		if (!stuff) return;
		if (stuff.then) {
			stuff = await stuff;
			continue;
		}
		if (stuff.next) {
			stuff.next();
			continue
		}
		console.log(stuff);
	 	throw Error();
	}
}
