"use strict"


module.exports = havel => {
	const zlib = require('zlib');
	const os = require('os');

	function bufferToKeyValue() {
		let keyBuffer = false;
		return havel.Transform({
			transform: function (chunk, enc, cb) {
				if (keyBuffer) {
					let entry = new KeyValue();
					entry.key.setBuffer(keyBuffer);
					entry.val.setBuffer(chunk);
					keyBuffer = false;
					return cb(null, entry);
				} else {
					keyBuffer = chunk;
					return cb();
				}
			},
			inputType: 'buffer',
			outputType: 'keyValue',
			name: 'bufferToKeyValue',
		});
	}

	function keyValueToBuffer(maxParallel = 1) {
		if (!maxParallel) maxParallel = os.cpus().length;

		let parallel = 0;
		let queue = [];
		let cbResume, cbFinished;

		async function addBufferData(bufferData) {
			let queueEntry = {};
			queue.push(queueEntry);
			
			if (parallel > maxParallel) await new Promise(resolve => cbResume = resolve);

			parallel++;
			bufferData.getBuffer().then(buffer => {
				parallel--;
				queueEntry.buffer = buffer;
				checkQueue();
				if (cbResume) {
					queueMicrotask(cbResume);
					cbResume = false;
				}
			})
		}

		function checkQueue() {
			while ((queue.length > 0) && (queue[0].buffer)) {
				node.stream.push(queue.shift().buffer);
			}
			if ((queue.length === 0) && cbFinished) cbFinished();
		}

		let node = havel.Transform({
			transform: async function (keyValue, enc, cb) {
				await addBufferData(keyValue.key);
				await addBufferData(keyValue.val);
				checkQueue();
				cb();
			},
			flush: function (cb) {
				cbFinished = cb;
				checkQueue();
			},
			inputType: 'keyValue',
			outputType: 'buffer',
			name: 'keyValueToBuffer',
		});
		
		return node;
	}

	function streamToKeyValue() {
		return havel.compose([havel.streamToBoxes(), bufferToKeyValue()], {name:'streamToKeyValue'});
	}

	function keyValueToStream(maxParallel = 1) {
		return havel.compose([keyValueToBuffer(maxParallel), havel.boxesToStream()], {name:'keyValueToStream'});
	}

	class KeyValue {
		constructor() {
			this.key = new BufferData();
			this.val = new CompressedBufferData();
		},
		async toString() {
			return JSON.stringify(await this.key.getObj())+': '+JSON.stringify(await this.val.getObj())
		}
	}

	class BufferData {
		constructor() {
			this.data   = undefined;
			this.buffer = undefined;
		}
		setData(_data) {
			this.data   = _data;
			this.buffer = undefined;
			return this;
		},
		setBuffer(_buffer) {
			this.data   = undefined;
			this.buffer = _buffer;
			return this;
		},
		async getData() {
			return this.data ??= JSON.parse(this.buffer);
		},
		async getBuffer() {
			return this.buffer ??= JSON.stringify(this.data);
		}
	}

	class CompressedBufferData extends BufferData {
		async getData() {
			return this.data ??= JSON.parse(await new Promise(res => 
				zlib.brotliDecompress(this.buffer, (err, bufferOut) => res(bufferOut))
			))
		},
		async getBuffer() {
			return this.buffer ??= await new Promise(res => 
				zlib.brotliCompress(
					JSON.stringify(this.data),
					{ params:{ [zlib.constants.BROTLI_PARAM_QUALITY]:zlib.constants.BROTLI_MAX_QUALITY } },
					(err, bufferOut) => res(bufferOut)
				)
			)
		}
	}
	
	return Object.assign(havel, {
		bufferToKeyValue,
		keyValueToBuffer,
		streamToKeyValue,
		keyValueToStream,
		KeyValue,
	})
}
