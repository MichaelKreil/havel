"use strict"

module.exports = Havel => {
	const Stream = require('stream');

	return Object.assign(Havel, {
		streamToChunks,
		streamToBoxes,
		boxesToStream,
		noiseBuffers,
		fromBuffer,
		toBuffer,
	})

	function streamToChunks(maxSize = 64*1024*1024) {
		let chunks = [], size = 0;
		return Havel.Transform({
			transform: (chunk, write) => {
				size += chunk.length;
				chunks.push(chunk);

				if (size < maxSize) return;

				chunk = Buffer.concat(chunks);
				while (chunk.length > maxSize) {
					write(chunk.slice(0, maxSize));
					chunk = chunk.slice(maxSize);
				}
				size = chunk.length;
				chunks = [chunk];
				return;
			},
			flush: () => Buffer.concat(chunks),
			inputType: 'stream',
			outputType: 'buffer',
			name: 'streamToChunks',
		});
	}

	function streamToBoxes() {
		let chunkSize, buffer = false;
		return Havel.Transform({
			transform: (chunk, write) => {
				buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;

				while (true) {
					if (buffer.length < 4) return;

					chunkSize = buffer.readUInt32LE(0) + 4;

					if (buffer.length < chunkSize) return;

					write(buffer.slice(4, chunkSize));
					buffer = buffer.slice(chunkSize);
				}
			},
			flush: () => {
				if (buffer.length > 0) throw Error();
			},
			inputType: 'stream',
			outputType: 'buffer',
			name: 'streamToBoxes',
		});
	}

	function boxesToStream() {
		return Havel.Transform({
			transform: (buffer, write) => {
				let header = Buffer.allocUnsafe(4);
				header.writeUInt32LE(buffer.length, 0);
				write(header);
				write(buffer);
			},
			inputType: 'buffer',
			outputType: 'stream',
			name: 'boxesToStream'
		});
	}

	function noiseBuffers(count = 256, size = 16*1024) {
		async function * generate() {
			for (let i = 0; i < count; i++) {
				let buffer = Buffer.allocUnsafe(size);
				for (let j = 0; j < size; j += 4) {
					buffer.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);
				}
				yield buffer;
			}
		}

		return Havel(Stream.Readable.from(generate()), {
			inputType:'nothing',
			outputType:'buffer',
			name:'noiseBuffers'
		})
	}

	function fromBuffer(buffer) {
		if (!Buffer.isBuffer(buffer)) throw Error('Havel.fromBuffer needs an buffer')
		const chunkSize = 65536;
		async function * generate() {
			for (let i = 0; i < buffer.length; i += chunkSize) yield buffer.slice(i, i+chunkSize);
		}

		return Havel(
			Stream.Readable.from(generate()),
			{
				inputType:'nothing',
				outputType:'buffer',
				name:'fromBuffer'
			}
		);
	}

	function toBuffer(cbToBuffer) {
		if (typeof cbToBuffer !== 'function') throw Error('Havel.toBuffer needs a function')

		let buffers = [];
		let stream = new Stream.Writable({ objectMode: true,
			write: (buffer, enc, cb) => { buffers.push(buffer); cb() }
		})
		stream.on('finish', () => cbToBuffer(Buffer.concat(buffers)));
		return Havel(
			stream,
			{
				inputType:'stream',
				outputType:'nothing',
				name:'toBuffer'
			}
		);
	}
}
