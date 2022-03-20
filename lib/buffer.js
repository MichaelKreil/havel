"use strict"

module.exports = Havel => {

	return Object.assign(Havel, {
		streamToChunks,
		streamToBoxes,
		boxesToStream,
	})

	function streamToChunks(maxSize = 64*1024*1024) {
		let chunks = [], size = 0;
		return Havel.Transform({
			transform: (chunk, write) => {
				size += chunk.length;
				chunks.push(chunk);

				if (size < maxSize) return;

				chunk = Buffer.concat(chunks);
				while (chunk.length < maxSize) {
					write(chunk.slice(0, maxSize));
					chunk = chunk.slice(maxSize);
				}
				size = chunk.length;
				chunks = [chunk];
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
}
