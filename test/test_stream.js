"use strict"

const Havel = require('../');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');

let bufferIn = Buffer.allocUnsafe(1024*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

let filename = resolve(os.tmpdir(), 'test.tmp');

describe('stream', () => {

	describe('readFile(), writeFile()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.writeFile(filename),
			], () => {
				Havel.pipeline([
					Havel.readFile(filename),
					Havel.toBuffer(bufferOut => {
						assert.deepEqual(bufferIn, bufferOut);
						done();
						fs.rmSync(filename);
					})
				])
			})
		)
	})
})
