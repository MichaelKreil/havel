"use strict"

const Stream = require('stream');
const allowedTypes = new Set('keyValue,nothing,buffer,object,stream,string'.split(','));
const havel = havelNode;

Object.assign(havel, {
	compose,
	pipeline,
	Transform,
})

module.exports = havel;

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
				console.log('########################################');
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

function Transform(opt) {
	if (typeof opt.transform !== 'function') throw Error('transform function must be defined');

	let parameters = {
		objectMode: true,
		readableObjectMode: true,
		writableObjectMode: true,
		autoDestroy: true,
		transform: opt.transform,
	}
	if (opt.flush) parameters.flush = opt.flush;
	let stream = new Stream.Transform(parameters);

	return havelNode(stream, opt);
}

function havelNode(stream, opt) {
	let inputType, outputType;
	let  inputTypeDef = opt.type ??  opt.inputType;
	let outputTypeDef = opt.type ?? opt.outputType;

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

function logPipeline (node) {
	let root = node;
	while (root.parent) root = root.parent;
	console.log(pipelineToString(root, node))
}
