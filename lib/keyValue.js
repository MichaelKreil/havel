"use strict"


module.exports = havel => {
	const zlib = require('zlib');

	return Object.assign(havel, {
		bufferToKeyValue,
		keyValueToBuffer,
		streamToKeyValue,
		keyValueToStream,
		KeyValue,
	})

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
		});
	}

	function keyValueToBuffer(maxParallel = 1) {
		if (!maxParallel) maxParallel = os.cpus().length;
		const maxBufferSize = 64*1024*1024;

		let parallel = 0;
		let bufferSize = 0;
		let queue = [];
		let cbResume, cbFinished;

		async function add(compressedBufferValue) {
			if (compressedBufferValue.hasBuffer()) {
				queue.push({buffer:await compressedBufferValue.getBuffer()})
			} else {
				let queueEntry = {};
				queue.push(queueEntry);
				
				if (parallel > maxParallel) await new Promise(resolve => cbResume = resolve);

				parallel++;
				compressedBufferValue.getBuffer().then(buffer => {
					parallel--;
					queueEntry.buffer = buffer;
					checkQueue();
					if (cbResume) {
						queueMicrotask(cbResume);
						cbResume = false;
					}
				})
			}
			checkQueue();
		}

		function checkQueue() {
			while ((queue.length > 0) && (queue[0].buffer)) {
				let firstEntry = queue.shift();
				stream.push(firstEntry.buffer);
			}
			if ((queue.length === 0) && (cbFinished)) cbFinished();
		}

		let stream = havel.Transform({
			transform: async function (keyValue, enc, cb) {
				await add(keyValue.key);
				await add(keyValue.val);
				cb();
			},
			flush: function (cb) {
				cbFinished = cb;
				checkQueue();
			},
			inputType: 'keyValue',
			outputType: 'buffer',
		});
		
		return stream;
	}

	function streamToKeyValue() {
		return havel.compose(havel.streamToBoxes(), bufferToKeyValue());
	}

	function keyValueToStream(maxParallel = 1) {
		return havel.compose(keyValueToBuffer(maxParallel), havel.boxesToStream());
	}

	function KeyValue(key, val) {
		let me = {
			key: new CompressedBufferObject(key),
			val: new CompressedBufferObject(val),
			toString,
		}

		return me;

		async function toString() {
			return JSON.stringify(await me.key.getObj())+': '+JSON.stringify(await me.val.getObj())
		}

		function CompressedBufferObject(obj) {
			let buf;
			return {
				setObj, setBuffer,
				getObj, getBuffer, hasBuffer,
			}
			function compress() {
				return new Promise(res => {
					zlib.brotliCompress(
						JSON.stringify(obj),
						{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:zlib.constants.BROTLI_MAX_QUALITY}},
						(err, _buf) => res(buf = _buf)
					)
				})
			}
			function decompress() {
				return new Promise(res => {
					zlib.brotliDecompress(buf, (err, _buf) => res(obj = JSON.parse(_buf)))
				})
			}	
			function setObj(_obj) {
				obj = _obj;
				buf = undefined;
			}
			function setBuffer(_buf) {
				buf = _buf;
				obj = undefined;
			}
			async function getObj() {
				if (obj === undefined) await decompress();
				return obj;
			}
			async function getBuffer() {
				if (buf === undefined) await compress();
				return buf;
			}
			function hasBuffer() {
				return (buf !== undefined);
			}
		}
	}
}
