'use strict'

/* global describe, it */

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
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.compressXZ({level:1})
				.finished(() => step(2))
				.decompressXZ()
				.finished(() => step(3))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})

	describe('spawn(head)', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.spawn('head', ['-c', 4096])
				.finished(() => step(1))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn.slice(0,4096), bufferOut);
					step(2)
				})
				.finished(() => step(3, done))
		})
	})
})
