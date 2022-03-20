"use strict"

const Havel = require('../');
const assert = require('assert');

let bufferIn = Buffer.allocUnsafe(64*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

describe('process', () => {

	describe('compressXZ() | decompressXZ()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.compressXZ({level:1}),
				Havel.decompressXZ(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					done();
				})
			])
		)
	})
})
