"use strict"

module.exports = havel => {
	
	return Object.assign(havel, {
		streamToChunks,
		streamToBoxes,
		boxesToStream,
	})

	function streamToChunks(maxSize = 64*1024*1024) {
		let chunks = [], size = 0;
		return havel.Transform({
			transform: (chunk, enc, cb) => {
				size += chunk.length;
				chunks.push(chunk);

				if (size < maxSize) return cb();

				chunk = Buffer.concat(chunks);
				while (chunk.length < maxSize) {
					this.push(chunk.slice(0,maxSize));
					chunk = chunk.slice(maxSize);
				}
				size = chunk.length;
				chunks = [chunk];
				cb();
			},
			flush: cb => cb(Buffer.concat(chunks)),
			inputType: 'stream',
			outputType: 'buffer',
			name: 'streamToChunks',
		});
	}

	function streamToBoxes() {
		let chunkSize, buffer = false;
		return havel.Transform({
			transform: function (chunk, enc, cb) {
				if (buffer) {
					buffer = Buffer.concat([buffer, chunk]);
				} else {
					buffer = chunk;
				}

				while (true) {
					if (buffer.length < 4) return cb();

					chunkSize = buffer.readUInt32LE(0)+4;
					
					if (chunkSize > buffer.length) return cb();
					
					this.push(buffer.slice(4, chunkSize));
					buffer = buffer.slice(chunkSize);
				}
				cb();
			},
			inputType: 'stream',
			outputType: 'buffer',
			name: 'streamToBoxes',
		});
	}

	function boxesToStream() {
		return havel.Transform({
			transform: function (chunk, enc, cb) {
				let header = Buffer.allocUnsafe(4);
				header.writeUInt32LE(chunk.length, 0);
				this.push(header);
				cb(null, chunk);
			},
			inputType: 'buffer',
			outputType: 'stream',
			name: 'boxesToStream'
		});
	}
}
