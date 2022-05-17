'use strict'

const { EventEmitter } = require('events');
const { Stream } = require('stream');


// handle errors in Promises
process.on('unhandledRejection', error => { throw error; });

const registeredNodeFactories = new Map();

function pipeline() {
	return new HavelPipeline();
}

class HavelNodeFactory {
	constructor(name, func) {
		this.func = func;
		this.name = name;
	}
	create(pipeline, args) {
		try {
			let node = {
				name: this.name,
				pipeline,
				iterator: this.func.apply({iterator:pipeline.lastIterator}, args)
			}
			//console.log('create', pipeline.lastIterator, this.name, node.iterator);
			return node;
		} catch (e) {
			console.log('ERROR in pipeline')
			console.log(pipeline.toString(node))
			throw e;
		}
	}
}

class HavelSubPipelineFactory {
	constructor(name, func) {
		this.func = func;
		this.name = name;
	}
	create(pipeline, args) {
		this.func(pipeline, ...args);
		let subPipeline = {
			name: this.name,
			pipeline,
			iterator: pipeline.lastIterator,
		}
		return subPipeline
	}
}

class HavelPipeline {
	#nodes = [];
	#lastNode = false;
	constructor() {
		let pipeline = this;
		for (let factory of registeredNodeFactories.values()) {
			if (pipeline[factory.name]) throw Error('Already defined');
			pipeline[factory.name] = function () {
				return pipeline.#add(factory, arguments);
			}
		}
	}
	/**
	 * @param  {} factory
	 * @param  {} args
	 */
	#add(factory, args) {
		//console.log('#add', factory.name, this.iterator);
		let node = factory.create(this, args);
		this.#nodes.push(node);
		this.#lastNode = node;
		return this;
	}
	toString(highlightNode) {
		let result = [];

		this.#nodes.forEach((node,i) => {
			let line = (node.name ?? 'unnamed');
			if (node === highlightNode) line = '\x1b[1;97m'+line+'\x1b[0;1;97m <===\x1b[0m'
			//if (i !== 0) result.push(`   \x1b[90m↓\x1b[0m`);
			result.push(`   ${line}`);
		})

		return '[\n'+result.join('\n')+'\n]';
	}
	get lastIterator() {
		return this.#lastNode?.iterator;
	}
}

function logPipeline(node) {
	console.log(node.pipeline.toString(node))
}


function registerSubPipeline(name, func) {
	let factory = new HavelSubPipelineFactory(name, func);
	if (registeredNodeFactories.has(name)) throw Error(`node factory "${name}" is already registered`);
	registeredNodeFactories.set(name, factory);
}

function registerNodeFactory(name, func) {
	let factory = new HavelNodeFactory(name, func);
	if (registeredNodeFactories.has(name)) throw Error(`node factory "${name}" is already registered`);
	registeredNodeFactories.set(name, factory);
}

function registerNodeFactoryFunction(func) {
	if (!func) throw Error('registerNodeFactoryFunction needs a function as parameter');
	if (typeof func !== 'function') throw Error('registerNodeFactoryFunction needs a function as parameter');
	switch (func.constructor.name) {
		case 'AsyncGeneratorFunction':
		case 'AsyncFunction':
			break;
		default:
			throw Error(`registerNodeFactoryFunction needs as parameter a Async(Generator)Function, and not "${func.constructor.name}"`)
	}
	registerNodeFactory(func?.name, func)
}

function registerNodeFactoryStream(name, func) {
	registerNodeFactory(name, async function* () {
		let iterator = this.iterator;
		let stream = await func(...arguments);
		//console.log(stream);
		if (!stream || !(stream instanceof Stream)) throw Error('stream must be valid');

		let writeable = (typeof stream._write === 'function');
		let readable  = (typeof stream._read  === 'function');

		console.log({readable, writeable});
		if (readable) {
			if (writeable) wrapWritableStream();
			for await (let chunk of stream) {
				//console.log('stream yield')
				yield chunk;
			}
		} else {
			if (writeable) {
				return await wrapWritableStream();
			} else {
				throw Error('stream must be at least readable or writable')
			}
		}

		async function wrapWritableStream() {
			console.log('wrapWritableStream')
			/*
			stream.on('error', err => {
				if (err.message === 'write EPIPE') return stream.end();
				throw err;
			})*/
			for await (let chunk of iterator) {
				//console.log('stream.write()')
				if (stream.write(chunk)) continue;
				await new Promise(res => stream.once('drain', res));
			}
			console.log('stream.end()')
			stream.end();
		}
	})
}

const Havel = {
	//compose,
	pipeline,
	//detectType,
	//wrapStream,
	//wrapFunc,
	//registerNode,
	registerNodeFactory,
	registerNodeFactoryFunction,
	registerNodeFactoryStream,
	registerSubPipeline,
	HavelPipeline,
}
module.exports = Havel;

