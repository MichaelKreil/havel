'use strict'

const allowedTypes = new Set('keyValue,nothing,buffer,object,string,stream'.split(','));
const { EventEmitter } = require('events');
const { Stream } = require('stream');



const Havel = {
	compose,
	pipeline,
	detectType,
	wrapStream,
	wrapFunc,
	registerNode,
}
module.exports = Havel;

const registeredNodeConstructors = new Map();

// handle errors in Promises
process.on('unhandledRejection', (error) => { throw error; });

function registerNode(name, callback) {
	registeredNodeConstructors.set(name, callback);
}

function pipeline() {
	return new HavelPipeline();
}

function pipelineToString(node, highlightNode) {

	let result = [];
	rec(node, 0);
	return result.join('\n');

	function rec(node, depth) {
		let prefix = '  '.repeat(depth);
		if (node.type === 'node') {
			let msg = (node.name ?? 'unnamed');
			if (node === highlightNode) msg = '\x1b[1m'+msg+' <===\x1b[0m'
			result.push(prefix + msg);
			return
		}
		if (node.type === 'pipeline') {
			let msg = (node.name ?? 'unnamed')+' [';
			if (node === highlightNode) msg = '\x1b[1m'+msg+' <===\x1b[0m'
			result.push(prefix + msg);
			node.nodes.forEach(n => rec(n, depth + 1));
			result.push(prefix + ']');
			return
		}
		result.push('  '.repeat(depth) + '\x1b[1mUNKNOWN NODE TYPE <===\x1b[0m');
	}
}

function compose(constructor) {
	return { constructor, composite:true }
}

function wrapStream() {
	let streamIn, streamOut, opt;
	switch (arguments.length) {
		case 2:
			if (typeof arguments[0]._write === 'function') streamIn  = arguments[0];
			if (typeof arguments[0]._read  === 'function') streamOut = arguments[0];
			opt = arguments[1];
			break;
		case 3:
			streamIn  = arguments[0];
			streamOut = arguments[1];
			opt       = arguments[2];
			break;
		default:
			throw Error('unexpected number of arguments');
	}
	if (streamIn  && !(streamIn  instanceof Stream)) throw Error('stream input must be valid');
	if (streamOut && !(streamOut instanceof Stream)) throw Error('stream output must be valid');


	opt.func = function (iterator) {
		let me = this;

		async function wrapStreamIn() {
			streamIn.on('error', err => {
				if (err.message === 'write EPIPE') return streamIn.end();
				throw err;
			})
			for await (let chunk of iterator) {
				if (streamIn.write(chunk)) continue;
				await new Promise(res => streamIn.once('drain', res));
			}
			streamIn.end();
		}

		async function* wrapStreamOut() {
			for await (let chunk of streamOut) yield chunk;
			me.finish();
		}

		if (streamIn) wrapStreamIn();
		if (streamOut) {
			return wrapStreamOut();
		} else {
			if (streamIn) streamIn.on('finish', () => me.finish());
			return false;
		}
	}
	return new HavelNode(opt);
}

function wrapFunc(opt) {
	if (!opt) throw Error('wrapNode needs parameters');
	return new HavelNode(opt);
}

class HavelNode extends EventEmitter {
	constructor(opt) {
		super();

		this.func = opt.func.bind(this);
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
	get type() { return 'node' }
	finish() { this.emit('finished') }
	error(err) {
		if (this.listenerCount('error') > 0) {
			this.emit('error');
		} else {
			throw err;
		}
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

class HavelPipeline extends EventEmitter {
	constructor() {
		super();

		this._nodes = [];

		let me = this;
		registeredNodeConstructors.forEach((constructor, name) => {
			me[name] = function () {
				let node = constructor(...arguments);
				node.name ??= name;
				me.add(node);
				return me;
			}
		})
	}
	add(node) {
		try {
			if (node.composite) {
				node.constructor(this);
				return this;
			}

			// the core of all the piping magic
			let lastNode = this.lastNode;
			let type = lastNode?.getOutputType() ?? 'nothing';
			node.setInputType(type);
			node.iter = node.func(lastNode?.iter);
			this._nodes.push(node);

			return this;
		} catch (e) {
			console.log('ERROR');
			if (!e.logged) logPipeline(pipeline);
			e.logged = true;
			throw e;
		}
	}
	get lastNode() {
		return this._nodes[this._nodes.length-1];
	}
	finished(cb) {
		this.lastNode.on('finished', cb);
		return this;
	}
	catch(cb) {
		this.lastNode.on('error', cb);
		return this;
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
