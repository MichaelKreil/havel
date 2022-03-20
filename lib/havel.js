"use strict"

const os = require('os');
const Stream = require('stream');
const allowedTypes = new Set('keyValue,nothing,buffer,object,stream,string'.split(','));
const Havel = wrapHavelStream;

Object.assign(Havel, {
	compose,
	pipeline,
	Transform,
})

module.exports = Havel;

function pipeline() {
	let havelNodes = Array.from(arguments);
	let cbFinished;
	if (typeof havelNodes[havelNodes.length - 1] === 'function') cbFinished = havelNodes.pop();

	let pipeline = compose(havelNodes);
	try {
		let lastNode = runHavelNodes(pipeline);
		if (cbFinished) lastNode.stream.once('finish', cbFinished);
	} catch (e) {
		logPipeline(pipeline);
		process.exit();
	}
}

function runHavelNodes(nodes) {
	return runHavelNodesRec([nodes]);

	function runHavelNodesRec(nodes, lastNode) {
		for (let node of nodes) {
			if (node.type === 'line') {
				lastNode = runHavelNodesRec(node.nodes, lastNode);
				continue;
			}

			try {
				if (node.type === 'node') {
					let type = lastNode?.getOutputType() ?? 'nothing';
					node.setInputType(type);

					let stream = lastNode?.stream;
					//console.log('lastNode', lastNode);
					//console.log('stream', stream);
					if (stream) stream.pipe(node.stream);

					lastNode = node;
					continue;
				}
				if (!node.type) throw new Error(`node is missing a type`);
				throw new Error(`unknown node type: ${node.type}`);
			} catch (e) {
				logPipeline(node);
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
			node.nodes.forEach(n => rec(n, depth + 1));
			result.push(prefix + ']');
			return
		}
		result.push('  '.repeat(depth) + "\x1b[1mUNKNOWN NODE TYPE <===\x1b[0m");
	}
}

function compose(nodes, name = 'pipeline') {
	let line = { type:'line', nodes, name };
	nodes.forEach(node => node.parent = line);
	return line;
}

function Transform(opt = {}) {
	opt.inputType  ??= 'anything';
	opt.outputType ??= 'same';

	let transform = opt.transform;

	if (typeof transform !== 'function') throw Error('transform function must be defined');

	const stream = new Stream.Duplex({
		write: async function write(chunk, encoding, cbFinished) {
			let result = await transform(chunk, result => stream.push(result));
			if ((result !== null) && (result !== undefined)) stream.push(result);
			cbFinished();
		},
		allowHalfOpen: false,
		readable: true,
		writeable: true,
		readableObjectMode: true,
		writableObjectMode: true,
		readableHighWaterMark: 16,
		writableHighWaterMark: 16,
	});

	if (opt.flush) {
		let flush = opt.flush;
		if (typeof flush !== 'function') throw Error('flush function must be a function');
		stream.on('finish', () => {
			let result = await flush(result => stream.push(result));
			if ((result !== null) && (result !== undefined)) stream.push(result);
			stream.push(null);
		))
	}

	return Havel(stream, opt);
}
/*
function TransformParallel(opt = {}) {
	opt.maxParallel ??= os.cpus().length;
	opt.queueSize ??= opt.maxParallel*16;

	let n = opt.queueSize;
	let parallel = 0;
	let writePos = 0;
	let readPos = 0;
	let queue = new Array(n);
	let cbResume, cbFinished;
	let transform = opt.transform;

	function checkQueue() {
		while ((readPos < writePos) && (queue[readPos % n].buffer)) {
			let e = queue[readPos % n];
			node.stream.push(e.buffer);
			e.buffer = undefined;
			readPos++;
		}
		if ((readPos === writePos) && cbFinished) cbFinished();
	}

	opt.transform = function(chunk, enc, cb) {
		let queueEntry = {};
		queue[writePos % n] = queueEntry;
		writePos++;

		if (parallel >= maxParallel) await new Promise(resolve => cbResume = resolve);

		parallel++;

		transform(chunk, enc, (err, result) => {

		})

		keyValue.getBufferPromise().then(buffer => {
			parallel--;
			queueEntry.buffer = buffer;
			checkQueue();
			if (cbResume) {
				queueMicrotask(cbResume);
				cbResume = false;
			}
		})
		checkQueue();
		cb();
	},
		flush: function(cb) {
			cbFinished = cb;
			checkQueue();
		},
		inputType: 'keyValue',
		outputType: 'buffer',
		name: 'keyValueToBuffer',
	}

	return Havel.Transform(opt);
}
*/

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
		if (inputTypeDef === 'anything') return inputType = type;
		throw new NodeError(node, `can't handle inputTypeDef "${inputTypeDef}" with type "${type}"`);
	}

	function getOutputType() {
		outputType = outputTypeDef;
		if (outputType === 'same') outputType = inputType;
		if (typeof outputType === 'function') outputType = outputType(inputType);
		if (allowedTypes.has(outputType)) return outputType;
		throw new NodeError(node, `can't handle outputTypeDef "${outputTypeDef}"`);
	}
}

function logPipeline(node) {
	let root = node;
	while (root.parent) root = root.parent;
	console.log(pipelineToString(root, node))
}
