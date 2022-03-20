"use strict"

const os = require('os');
const Stream = require('stream');
const allowedTypes = new Set('keyValue,nothing,buffer,object,stream,string'.split(','));
const Havel = wrapHavelStream;

Object.assign(Havel, {
	compose,
	pipeline,
	Transform,
	detectType,
})

module.exports = Havel;

function pipeline(streams, cbFinished) {
	if (!Array.isArray(streams)) throw Error('pipeline needs an array of streams')

	let lastNode, pipeline = compose(streams);
	try {
		lastNode = runHavelNodes(pipeline);
	} catch (e) {
		if (!e.logged) logPipeline(pipeline);
		e.logged = true;
		throw e;
	}
	if (cbFinished) {
		if (typeof cbFinished !== 'function') throw Error('pipelines finish callback must be a function')
		lastNode.stream.once('finish', cbFinished);
	}
}

function runHavelNodes(nodes) {
	return runHavelNodesRec([nodes]);

	function runHavelNodesRec(nodes, lastNode) {
		for (let node of nodes) {
			if (node.type === 'line') {
				lastNode = runHavelNodesRec(node.streams, lastNode);
				continue;
			}

			try {
				if (node.type === 'node') {
					let type = lastNode?.getOutputType() ?? 'nothing';
					node.setInputType(type);

					let stream = lastNode?.stream;
					if (stream) stream.pipe(node.stream);

					lastNode = node;
					continue;
				}
				if (!node.type) throw new Error(`node is missing a type`);
				throw new Error(`unknown node type: ${node.type}`);
			} catch (e) {
				if (!e.logged) logPipeline(node);
				e.logged = true;
				throw e;
			}
		}
		return lastNode;
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
			node.streams.forEach(n => rec(n, depth + 1));
			result.push(prefix + ']');
			return
		}
		result.push('  '.repeat(depth) + "\x1b[1mUNKNOWN NODE TYPE <===\x1b[0m");
	}
}

function compose(streams, name = 'pipeline') {
	if (!Array.isArray(streams)) throw Error('compose needs an array of streams')

	let line = { type:'line', streams, name };
	streams.forEach(node => node.parent = line);
	return line;
}

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
}

function wrapHavelStream(stream, opt) {
	let inputType, outputType;
	let  inputTypeDef =  opt.inputType || opt.type;
	let outputTypeDef = opt.outputType || opt.type;

	let node = {
		type: 'node',
		stream,
		name: opt.name,
		setInputType,
		getOutputType,
	}
	return node;

	function setInputType(type) {
		if (!allowedTypes.has(type)) throw Error(`type ${type} is not allowed`);
		if (inputTypeDef === type) return inputType = type;
		if (inputTypeDef === 'anything') {
			if (type === 'stream') throw Error('stream is not "anything"')
			return inputType = type;
		}
		if ((inputTypeDef === 'stream') && (type === 'buffer')) return inputType = 'stream';

		throw Error(`can't handle inputTypeDef "${inputTypeDef}" with type "${type}"`);
	}

	function getOutputType() {
		outputType = outputTypeDef;
		if (outputType === 'same') outputType = inputType;
		if (typeof outputType === 'function') outputType = outputType(inputType);
		if (allowedTypes.has(outputType)) return outputType;
		throw Error(`can't handle outputTypeDef "${outputTypeDef}"`);
	}
}

function logPipeline(node) {
	let root = node;
	while (root.parent) root = root.parent;
	console.log(pipelineToString(root, node))
}

function detectType(obj) {
	if (Buffer.isBuffer(obj)) return 'buffer';
	if (typeof obj === 'number') return 'object';
	if (typeof obj === 'object') return 'object';
	if (typeof obj === 'string') return 'string';
	throw Error('unknown type '+(typeof obj));
}
