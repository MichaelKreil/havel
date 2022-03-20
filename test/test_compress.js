"use strict"

const Havel = require('../');
const assert = require('assert');

let bufferIn = Buffer.allocUnsafe(1024*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

describe('compress', () => {

	describe('compressGzip() | decompressGzip()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.compressGzip({level:1}),
				Havel.decompressGzip(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					done();
				})
			])
		)
	})

	describe('compressBrotli() | decompressBrotli()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.compressBrotli({level:1}),
				Havel.decompressBrotli(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					done();
				})
			])
		)
	})
})
