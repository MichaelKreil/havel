'use strict'

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
		let node;
		try {
			return node = {
				name: this.name,
				pipeline,
				iterator: (async () => {
					let lastIterator = await pipeline.lastIterator;
					let result = await this.func.apply({ iterator: lastIterator }, args)
					return result;
				})()
			}
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
		return {
			name: this.name,
			pipeline,
			iterator: pipeline.lastIterator,
		}
	}
}


/**
 * @class Pipeline
 **/
class HavelPipeline {
	#nodes = [];
	#lastNode = false;
	constructor() {
		let pipeline = this;
		for (let factory of registeredNodeFactories.values()) {
			if (pipeline[factory.name]) throw Error('Already defined');
			pipeline[factory.name] = function () {
				pipeline.#add(factory, arguments)
				return pipeline;
			}
		}
	}
	#add(factory, args) {
		let node = factory.create(this, args);
		this.#nodes.push(node);
		this.#lastNode = node;
		return this;
	}
	toString(highlightNode) {
		let result = [];

		this.#nodes.forEach(node => {
			let line = (node.name ?? 'unnamed');
			if (node === highlightNode) line = '\x1b[1;97m' + line + '\x1b[0;1;97m <===\x1b[0m'
			result.push(`   ${line}`);
		})

		return '[\n' + result.join('\n') + '\n]';
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
		case 'GeneratorFunction':
		case 'AsyncFunction':
			break;
		default:
			throw Error(`registerNodeFactoryFunction needs as parameter a Async(Generator)Function, and not "${func.constructor.name}"`)
	}
	registerNodeFactory(func?.name, func)
}

function registerNodeFactoryStream(name, func) {
	registerNodeFactory(name, async function () {
		let iterator = await this.iterator;
		let stream = await func(...arguments);
		if (!stream) throw Error('stream must be defined');

		let writable, readable;
		if (stream instanceof Stream) {
			if (typeof stream._write === 'function') writable = stream;
			if (typeof stream._read === 'function') readable = stream;
		} else {
			readable = stream.readable;
			writable = stream.writable;
		}

		if (readable) {
			return (async function* () {
				let wrapper
				if (writable) wrapper = wrapWritableStream();
				for await (let chunk of readable) yield chunk;
				if (wrapper) await wrapper;
			})();
		} else {
			if (writable) {
				await wrapWritableStream();
			} else {
				throw Error('stream must be at least readable or writable')
			}
			return;
		}

		async function wrapWritableStream() {
			let resolve = false, error = false;
			writable.on('error', err => {
				doContinue(); error = err;
			})
			writable.on('drain', () => {
				doContinue()
			});
			for await (let chunk of iterator) {
				if (!writable.write(chunk)) {
					await new Promise(res => resolve = res);
				}
				if (error) break;
			}
			await new Promise(res => writable.end(res));

			function doContinue() {
				if (!resolve) return
				let func = resolve;
				resolve = false;
				func();
			}
		}
	})
}

const Havel = {
	pipeline,
	registerNodeFactory,
	registerNodeFactoryFunction,
	registerNodeFactoryStream,
	registerSubPipeline,
	HavelPipeline,
}
module.exports = Havel;

