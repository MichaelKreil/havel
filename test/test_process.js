"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

let bufferIn = Buffer.allocUnsafe(64*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

describe('process', () => {

	helper.checkCompleteness('../lib/process.js',
		'spawn,compressXZ,decompressXZ'
	);

	describe('compressXZ() | decompressXZ()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.compressXZ({level:1}).on('finished', () => step(2)),
				Havel.decompressXZ().on('finished', () => step(3)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				}).on('finished', () => step(5))
			).on('finished', () => step(6, done))
		})
	})
})
