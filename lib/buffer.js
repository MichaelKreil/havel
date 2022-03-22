"use strict"

module.exports = Havel => {

	Havel.registerNode('streamToChunks', (maxSize = 64*1024*1024) => Havel.wrapFunc({
		func: async function* streamToChunks(iterator) {
			let chunks = [], size = 0;
			for await (let chunk of iterator) {
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
			this.finish();
		},
		inputType: 'stream',
		outputType: 'buffer',
	}))

	Havel.registerNode('streamToBoxes', () => Havel.wrapFunc({
		func: async function* streamToBoxes(iterator) {
			let chunkSize, buffer = false;
			for await (let chunk of iterator) {
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
			this.finish();
		},
		inputType: 'stream',
		outputType: 'buffer',
	}))

	Havel.registerNode('boxesToStream', () => Havel.wrapFunc({
		func: async function* boxesToStream(iterator) {
			for await (let chunk of iterator) {
				let header = Buffer.allocUnsafe(4);
				header.writeUInt32LE(chunk.length, 0);
				yield header;
				yield chunk;
			}
			this.finish();
		},
		inputType: 'buffer',
		outputType: 'stream',
	}))

	Havel.registerNode('noiseBuffers', (count = 256, size = 16*1024) => Havel.wrapFunc({
		func: function* noiseBuffers() {
			for (let i = 0; i < count; i++) {
				let buffer = Buffer.allocUnsafe(size);
				for (let j = 0; j < size; j += 4) {
					buffer.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);
				}
				yield buffer;
			}
			this.finish();
		},
		inputType:'nothing',
		outputType:'buffer',
	}))

	Havel.registerNode('fromBuffer', (buffer, chunkSize = 65536) => Havel.wrapFunc({
		func: function* fromBuffer() {
			if (!Buffer.isBuffer(buffer)) throw Error('Havel.fromBuffer needs an buffer')
			for (let i = 0; i < buffer.length; i += chunkSize) yield buffer.slice(i, i+chunkSize);
			this.finish();
		},
		inputType:'nothing',
		outputType:'buffer',
		name:'fromBuffer'
	}))

	Havel.registerNode('toBuffer', (cbToBuffer) => Havel.wrapFunc({
		func: async function toBuffer(iterator) {
			if (typeof cbToBuffer !== 'function') throw Error('Havel.toBuffer needs a function')
			let buffers = [];
			for await (let chunk of iterator) {
				if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk);
				buffers.push(chunk);
			}
			await cbToBuffer(Buffer.concat(buffers));
			this.finish();
		},
		inputType:'anything',
		outputType:'nothing',
		name:'toBuffer'
	}))
}
