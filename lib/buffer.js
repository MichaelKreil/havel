'use strict'

module.exports = Havel => {

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function streamToChunks
	 * @desc cuts a stream into chunks
	 * @param {Number} maxSize size of the chunks
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* streamToChunks(maxSize = 64 * 1024 * 1024) {
		let chunks = [], size = 0;
		for await (let chunk of this.iterator) {
			size += chunk.length;
			chunks.push(chunk);

			if (size < maxSize) continue;

			chunk = Buffer.concat(chunks);
			while (chunk.length > maxSize) {
				yield chunk.slice(0, maxSize);
				chunk = chunk.slice(maxSize);
			}
			size = chunk.length;
			chunks = [chunk];
		}
		if (size > 0) yield Buffer.concat(chunks);
	});


	/**
	 * @function streamToBoxes
	 * @desc Cuts a stream into boxes. Every box is a block, starting with a 32-bit unsigned integer with the size of the box
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* streamToBoxes() {
		let chunkSize, buffer = false;
		for await (let chunk of this.iterator) {
			buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;

			while (true) {
				if (buffer.length < 4) break;

				chunkSize = buffer.readUInt32LE(0) + 4;

				if (buffer.length < chunkSize) break;

				yield buffer.slice(4, chunkSize);
				buffer = buffer.slice(chunkSize);
			}
		}
		if (buffer.length > 0) throw Error('having leftovers');
	})

	/**
	 * @function boxesToStream
	 * @desc concats boxes to a stream
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function* boxesToStream() {
		for await (let chunk of this.iterator) {
			let header = Buffer.allocUnsafe(4);
			header.writeUInt32LE(chunk.length, 0);
			yield header;
			yield chunk;
		}
	})

	/**
	 * @function noiseBuffers
	 * @desc creates a buffer of random bytes
	 * @param {Number} count=256 how many buffers
	 * @param {Number} size=16K size of each buffer
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(function* noiseBuffers(count = 256, size = 16 * 1024) {
		for (let i = 0; i < count; i++) {
			let buffer = Buffer.allocUnsafe(size);
			for (let j = 0; j < size; j += 4) {
				buffer.writeUInt32LE(Math.floor(Math.random() * 0x100000000), j);
			}
			yield buffer;
		}
	})

	/**
	 * @function fromBuffer
	 * @desc cuts a buffer into chunks
	 * @param {Buffer} buffer
	 * @param {Number} chunkSize=64K
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(function* fromBuffer(buffer, chunkSize = 65536) {
		if (!Buffer.isBuffer(buffer)) throw Error('Havel.fromBuffer needs an buffer')
		for (let i = 0; i < buffer.length; i += chunkSize) yield buffer.slice(i, i + chunkSize);
	})

	/**
	 * @function toBuffer
	 * @desc concats a stream into a buffer
	 * @param {Function} cbToBuffer callback
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryFunction(async function toBuffer(cbToBuffer) {
		if (typeof cbToBuffer !== 'function') throw Error('Havel.toBuffer needs a function')
		let buffers = [];
		for await (let chunk of this.iterator) {
			if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk);
			buffers.push(chunk);
		}
		await cbToBuffer(Buffer.concat(buffers));
	});
}
