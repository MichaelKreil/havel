"use strict"

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
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.compressGzip({level:1}).on('finished', () => step(2)),
				Havel.decompressGzip().on('finished', () => step(3)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				}).on('finished', () => step(5))
			).on('finished', () => step(6, done))
		})
	})

	describe('compressBrotli() | decompressBrotli()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.compressBrotli({level:1}).on('finished', () => step(2)),
				Havel.decompressBrotli().on('finished', () => step(3)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				}).on('finished', () => step(5))
			).on('finished', () => step(6, done))
		})
	})
})
