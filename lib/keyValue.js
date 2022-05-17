'use strict'


module.exports = Havel => {
	const v8 = require('v8');
	const os = require('os');
	const util = require('util');
	const zlib = require('zlib');

	/**
	 * @augments Pipeline
	 */
	
	/**
	 * @function bufferToKeyValue
	 * @desc unpacks buffers into KeyValue
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* bufferToKeyValue() {
		for await (const buffer of this.iterator) yield new KeyValue(buffer);
	})

	/**
	 * @function keyValueToBuffer
	 * @desc packs KeyValues into buffers
	 * @param {Number} maxParallel
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* keyValueToBuffer (maxParallel) {
		if (!maxParallel) maxParallel = os.cpus().length;

		let parallel = 0;
		let queue = [];
		let cbResume, finished, cbCheckQueue;
		let iterator = this.iterator;

		keyValueToBufferIn();
		yield* keyValueToBufferOut();

		function checkQueue() {
			return new Promise(res => {
				queueMicrotask(() => {
					if (cbCheckQueue) cbCheckQueue();
					res();
				})
			})
		}

		async function keyValueToBufferIn() {
			for await (const keyValue of iterator) {
				let queueEntry = {};
				queue.push(queueEntry);

				if (parallel >= maxParallel) await new Promise(resolve => cbResume = resolve);

				parallel++;
				keyValue.getBufferPromise().then(async buffer => {
					parallel--;
					queueEntry.buffer = buffer;
					await checkQueue();

					if (cbResume) {
						cbResume();
						cbResume = false;
					}
				})
			}
			finished = true;
			await checkQueue();
		}

		async function* keyValueToBufferOut() {
			while (true) {
				await new Promise(res => cbCheckQueue = res);
				cbCheckQueue = false;

				while ((queue.length > 0) && (queue[0].buffer)) {
					yield queue.shift().buffer;
				}

				if ((queue.length === 0) && finished) break;
			}
		}
	})

	/**
	 * @function keyValueCheckOrder
	 * @desc check, e.g. if the keys are in ascending order
	 * @param {Function} cbError throw Error
	 * @param {Function} cbCheck check, default: (a,b) => a < b
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* keyValueCheckOrder(cbError, cbCheck) {
		cbError ??= () => { throw Error() };
		cbCheck ??= (a,b) => a < b

		if (typeof cbCheck !== 'function') throw Error('Havel.keyValueCheckOrder needs a function')
		let lastKey = undefined;
		for await (let entry of this.iterator) {
			let key = entry.key;
			if (lastKey !== undefined) {
				if (!(await cbCheck(lastKey, key))) {
					return cbError();
				}
			}
			lastKey = key;
			yield entry;
		}

	})

	/**
	 * @function streamToKeyValue
	 * @desc stream to KeyValues
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerSubPipeline('streamToKeyValue', p => p.streamToBoxes().bufferToKeyValue())

	/**
	 * @function keyValueToStream
	 * @desc KeyValues to stream
	 * @param {Number} maxParallel
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerSubPipeline('keyValueToStream', (p, maxParallel) => p.keyValueToBuffer(maxParallel).boxesToStream())

	/**
	 * @function keyValueMerge
	 * @desc merges two pipeline
	 * @param {Pipeline} pipeline2 2nd pipeline to merge with
	 * @param {Function} cbEntry callback for every entry pair. called with (e1,e2). e1 or e2 can be null
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* keyValueMerge(pipeline2, cbEntry) {
		if (!(pipeline2 instanceof Havel.HavelPipeline)) throw Error('Havel.keyValueMerge needs a pipeline as first parameter')
		if (typeof cbEntry !== 'function') throw Error('Havel.keyValueMerge needs a merge callback as third parameter')

		let iterator1 = this.iterator;
		let iterator2 = await pipeline2.lastIterator;
		let entry1 = await iterator1.next();
		let entry2 = await iterator2.next();

		while (true) {
			if (entry1 && !entry1.done) {
				if (entry2 && !entry2.done) {
					let key1 = entry1.value.key;
					let key2 = entry2.value.key;
					if (key1 === key2) {
						// equal
						yield await cbEntry(entry1.value, entry2.value);
						entry1 = await iterator1.next();
						entry2 = await iterator2.next();
						continue;
					} else if (key1 < key2) {
						yield await cbEntry(entry1.value, null);
						entry1 = await iterator1.next();
						continue;
					} else if (key1 > key2) {
						yield await cbEntry(null, entry2.value);
						entry2 = await iterator2.next();
						continue;
					}
					throw Error('should never have reached this')
				} else {
					yield await cbEntry(entry1.value, null);
					entry1 = await iterator1.next();
					continue;
				}
			} else {
				if (entry2 && !entry2.done) {
					yield await cbEntry(null, entry2.value);
					entry2 = await iterator2.next();
					continue;
				} else {
					return;
				}
			}
		}
	})

	/**
	 * @class
	 */
	class KeyValue {
		#key = undefined;
		#value = undefined;
		#buffer = undefined;
		/**
		 * @constructor
		 */
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
		/**
		 * @function
		 **/
		async toStringPromise() {
			return JSON.stringify(this.#key+': '+JSON.stringify(await this.getValuePromise()))
		}
		/**
		 * @function
		 **/
		[Symbol.for('nodejs.util.inspect.custom')]() {
			return 'KeyValue '+util.inspect({key:this.#key, value:this.#value, buffer:this.#buffer}, {colors:true});
		}
		/**
		 * @function
		 **/
		get key() {
			return this.#key;
		}
		/**
		 * @function
		 **/
		setValue(value) {
			this.#value = value;
			this.#buffer = undefined;
		}
		/**
		 * @function
		 **/
		setBuffer(buffer) {
			this.#buffer = buffer;
			this.#value = undefined;
			this.#extractKey();
		}
		/**
		 * @function
		 **/
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
		/**
		 * @function
		 **/
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
		/**
		 * @function
		 **/
		#extractKey() {
			if (this.#buffer === undefined) throw Error('buffer missing');
			this.#key = v8.deserialize(this.#buffer.slice(2, this.#buffer.readUInt16LE(0)+2));
		}
		/**
		 * @function
		 **/
		#decompressPromise(bufferIn) {
			return new Promise(res =>  zlib.brotliDecompress(bufferIn, (err, bufferOut) => res(bufferOut)))
		}
		/**
		 * @function
		 **/
		#compressPromise(bufferIn) {
			return new Promise(res =>  zlib.brotliCompress(
				bufferIn,
				{ params:{ [zlib.constants.BROTLI_PARAM_QUALITY]:zlib.constants.BROTLI_MAX_QUALITY } },
				(err, bufferOut) => res(bufferOut)
			))
		}
	}

	Havel.KeyValue = KeyValue;
}
