"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

let text = [];
for (let i = 0; i < 65535; i++) text[i] = i;
text = String.fromCharCode(...text);
let bufferIn = Buffer.from(text);

describe('string', () => {

	helper.checkCompleteness('../lib/string.js',
		'split,join,toBase64,toHex'
	);

	describe('split()', () => {
		it('correct number of lines', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.split()
				.finished(() => step(2))
				.toArray(lines => {
					assert.deepEqual(2, lines.length);
					step(3)
				})
				.finished(() => step(4, done))
		})
	})

	describe('split() | join()', () => {
		it('output === input', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.split()
				.finished(() => step(2))
				.join()
				.finished(() => step(3))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})

	describe('toBase64()', () => {
		it('correct conversion', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.toBase64()
				.finished(() => step(2))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('base64')));
					step(3)
				})
				.finished(() => step(4, done))
		})
	})

	describe('toHex()', () => {
		it('correct conversion', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromBuffer(bufferIn)
				.finished(() => step(1))
				.toHex()
				.finished(() => step(2))
				.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('hex')));
					step(3)
				})
				.finished(() => step(4, done))
		})
	})
})
