"use strict"

const Havel = require('../');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');
const helper = require('./helper.js');

let bufferIn = Buffer.allocUnsafe(1024*1024);
for (let j = 0; j < bufferIn.length; j += 4) bufferIn.writeUInt32LE(Math.floor(Math.random()*0x100000000), j);

let filename = resolve(os.tmpdir(), 'test.tmp');

describe('stream', () => {

	helper.checkCompleteness('../lib/stream.js',
		'readFile,writeFile'
	);

	describe('readFile(), writeFile()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();

			Havel.pipeline([
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.writeFile(filename).on('finished', () => step(2)),
			], () => {
				step(3)
				assert.deepEqual(bufferIn, fs.readFileSync(filename));

				Havel.pipeline([
					Havel.readFile(filename, {progress:true}).on('finished', () => step(4)),
					Havel.toBuffer(bufferOut => {
						assert.deepEqual(bufferIn, bufferOut);
						step(5)
						fs.rmSync(filename);
					})
				], () => step(6, done))
			})
		})
	})
})
