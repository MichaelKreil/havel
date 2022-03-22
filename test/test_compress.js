'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

let bufferIn = Buffer.allocUnsafe(1024*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

describe('compress', () => {

	helper.checkCompleteness('../lib/compress.js',
		'compressGzip,decompressGzip,compressBrotli,decompressBrotli'
	);

	describe('compressGzip() | decompressGzip()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.compressGzip({level:1})
				.finished(() => step(2))
				.decompressGzip()
				.finished(() => step(3))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})

	describe('compressBrotli() | decompressBrotli()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.compressBrotli({level:1})
				.finished(() => step(2))
				.decompressBrotli()
				.finished(() => step(3))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})
})
