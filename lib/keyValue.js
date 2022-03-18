"use strict"


module.exports = havel => {
	const zlib = require('zlib');
	const os = require('os');

	function bufferToKeyValue() {
		return havel.Transform({
			transform: (chunk, enc, cb) => cb(null, KeyValue(chunk)),
			inputType: 'buffer',
			outputType: 'keyValue',
			name: 'bufferToKeyValue',
		});
	}

	function keyValueToBuffer(maxParallel) {
		if (!maxParallel) maxParallel = os.cpus().length;

		let parallel = 0;
		let queue = [];
		let cbResume, cbFinished;

		function checkQueue() {
			while ((queue.length > 0) && (queue[0].buffer)) {
				node.stream.push(queue.shift().buffer);
			}
			if ((queue.length === 0) && cbFinished) cbFinished();
		}

		let node = havel.Transform({
			transform: async function (keyValue, enc, cb) {
				let queueEntry = {};
				queue.push(queueEntry);
				
				if (parallel > maxParallel) await new Promise(resolve => cbResume = resolve);

				parallel++;
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

	function keyValueToStream(maxParallel) {
		return havel.compose([keyValueToBuffer(maxParallel), havel.boxesToStream()], {name:'keyValueToStream'});
	}

	class KeyValue {
		#key = undefined;
		#value = undefined;
		#buffer = undefined;
		constructor() {
			if (arguments.length === 1) {
				this.#buffer = arguments[0];
				if (!Buffer.isBuffer(this.#buffer)) throw Error('must be a buffer');
				this.#extractKey();
			} else if (arguments.length === 2) {
				this.#key   = arguments[0];
				this.#value = arguments[1];
			}
			if (this.#key === undefined) throw Error('need a key');
		}
		async toStringPromise() {
			return JSON.stringify(this.#key+': '+JSON.stringify(await this.getValuePromise()))
		}
		get key() {
			return this.#key;
		}
		setValue(value) {
			this.#value = value;
			this.#buffer = undefined;
		}
		setBuffer(buffer) {
			this.#buffer = buffer;
			this.#value = undefined;
			this.#extractKey();
		}
		async getValuePromise() {
			if (this.#value === undefined) {
				if (this.#buffer === undefined) throw Error('no buffer defined');
				this.#value = JSON.parse(await this.#decompressPromise(buffer.slice(this.#buffer.readUInt16LE(0)+2)));
			}
			return this.#value;
		}
		async getBufferPromise() {
			if (this.#buffer === undefined) {
				this.#buffer = Buffer.concat([
					Buffer.allocUnsafe(2),
					Buffer.from(JSON.stringify(this.#key)),
					await this.#compressPromise(JSON.stringify(this.#value))
				])
			}
			return this.buffer;
		}
		#extractKey() {
			if (this.buffer === undefined) throw Error('buffer missing');
			this.#key = JSON.parse(this.#buffer.slice(2, this.buffer.readUInt16LE(0)+2));
		}
		#decompressPromise(bufferIn) {
			return new Promise(res =>  zlib.brotliDecompress(bufferIn, (err, bufferOut) => res(bufferOut)))
		}
		#compressPromise(bufferIn) {
			return new Promise(res =>  zlib.brotliCompress(
				bufferIn,
				{ params:{ [zlib.constants.BROTLI_PARAM_QUALITY]:zlib.constants.BROTLI_MAX_QUALITY } },
				(err, bufferOut) => res(bufferOut)
			))
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
