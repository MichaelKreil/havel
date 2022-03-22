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

function compose(construct) {
	return { construct, composite:true }
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
		this._name = opt.name;
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
	get name() { return this._name }
	set name(text) { this._name = text }
	finish() { this.emit('finished') }
	error(err) {
		if (this.listenerCount('error') > 0) {
			this.emit('error');
		} else {
			logPipeline(this);
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
		node.pipeline = this;

		if (node.composite) {
			node.construct(this);
			return this;
		}

		// the core of all the piping magic
		let lastNode = this.lastNode;
		let type = lastNode?.getOutputType() ?? 'nothing';
		node.setInputType(type);
		node.getOutputType();
		node.iter = node.func(lastNode?.iter);
		this._nodes.push(node);

		return this;
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
	toString(highlightNode) {
		let result = [];

		this._nodes.forEach((node,i) => {
			let msg = (node.name ?? 'unnamed');
			if (node === highlightNode) msg = '\x1b[1;97m'+msg+'\x1b[0;1;97m <===\x1b[0m'
			if (i === 0) {
				result.push(`   \x1b[34m↓ ${node.inputType}\x1b[0m`);
			}
			result.push(`   ${msg}`);
			result.push(`   \x1b[34m↓ ${node.outputType}\x1b[0m`);
		})

		return '[\n'+result.join('\n')+'\n]';
	}
}

function logPipeline(node) {
	console.log(node.pipeline.toString(node))
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
