'use strict'

module.exports = Havel => {

	async function* streamToChunks(maxSize = 64*1024*1024) {
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
	}
	Havel.registerNodeFactoryFunction(streamToChunks);

	async function* streamToBoxes() {
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
	}
	Havel.registerNodeFactoryFunction(streamToBoxes);

	async function* boxesToStream() {
		for await (let chunk of this.iterator) {
			let header = Buffer.allocUnsafe(4);
			header.writeUInt32LE(chunk.length, 0);
			yield header;
			yield chunk;
		}
	}
	Havel.registerNodeFactoryFunction(boxesToStream);

	async function* noiseBuffers(count = 256, size = 16*1024) {
		for (let i = 0; i < count; i++) {
			let buffer = Buffer.allocUnsafe(size);
			for (let j = 0; j < size; j += 4) {
				buffer.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);
			}
			yield buffer;
		}
	}
	Havel.registerNodeFactoryFunction(noiseBuffers);

	
	async function* fromBuffer(buffer, chunkSize = 65536) {
		if (!Buffer.isBuffer(buffer)) throw Error('Havel.fromBuffer needs an buffer')
		for (let i = 0; i < buffer.length; i += chunkSize) yield buffer.slice(i, i+chunkSize);
	}
	Havel.registerNodeFactoryFunction(fromBuffer);

	async function toBuffer(cbToBuffer) {
		if (typeof cbToBuffer !== 'function') throw Error('Havel.toBuffer needs a function')
		let buffers = [];
		for await (let chunk of this.iterator) {
			if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk);
			buffers.push(chunk);
		}
		await cbToBuffer(Buffer.concat(buffers));
	}
	Havel.registerNodeFactoryFunction(toBuffer);
}
