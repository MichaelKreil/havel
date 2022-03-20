"use strict"


module.exports = Havel => {
	const v8 = require('v8');
	const os = require('os');
	const util = require('util');
	const zlib = require('zlib');

	function bufferToKeyValue() {
		return Havel.Transform({
			transform: buffer => new KeyValue(buffer),
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

		function checkQueue(write) {
			while ((queue.length > 0) && (queue[0].buffer)) {
				write(queue.shift().buffer);
			}
			if ((queue.length === 0) && cbFinished) cbFinished();
		}

		let node = Havel.Transform({
			transform: async function(keyValue, write) {
				let queueEntry = {};
				queue.push(queueEntry);

				if (parallel >= maxParallel) await new Promise(resolve => cbResume = resolve);

				parallel++;
				keyValue.getBufferPromise().then(buffer => {
					parallel--;
					queueEntry.buffer = buffer;
					checkQueue(write);
					if (cbResume) {
						queueMicrotask(cbResume);
						cbResume = false;
					}
				})
				checkQueue(write);
			},
			flush: write => {
				checkQueue(write);
				return new Promise(res => cbFinished = res);
			},
			inputType: 'keyValue',
			outputType: 'buffer',
			name: 'keyValueToBuffer',
		});

		return node;
	}

	function streamToKeyValue() {
		return Havel.compose([Havel.streamToBoxes(), bufferToKeyValue()], 'streamToKeyValue');
	}

	function keyValueToStream(maxParallel) {
		return Havel.compose([keyValueToBuffer(maxParallel), Havel.boxesToStream()], 'keyValueToStream');
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
		[Symbol.for('nodejs.util.inspect.custom')]() {
			return 'KeyValue '+util.inspect({key:this.#key, value:this.#value, buffer:this.#buffer}, {colors:true});
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
				let buffer = this.#buffer;
				buffer = buffer.slice(buffer.readUInt16LE(0)+2);
				buffer = await this.#decompressPromise(buffer);
				this.#value = v8.deserialize(buffer);
			}
			return this.#value;
		}
		async getBufferPromise() {
			if (this.#buffer === undefined) {
				let keyBuffer = v8.serialize(this.#key);
				this.#buffer = Buffer.concat([
					Buffer.allocUnsafe(2),
					keyBuffer,
					await this.#compressPromise(v8.serialize(this.#value))
				])
				this.#buffer.writeUInt16LE(keyBuffer.length, 0);
			}
			return this.#buffer;
		}
		#extractKey() {
			if (this.#buffer === undefined) throw Error('buffer missing');
			this.#key = v8.deserialize(this.#buffer.slice(2, this.#buffer.readUInt16LE(0)+2));
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

	return Object.assign(Havel, {
		bufferToKeyValue,
		keyValueToBuffer,
		streamToKeyValue,
		keyValueToStream,
		KeyValue,
	})
}
