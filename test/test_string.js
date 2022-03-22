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
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.split().on('finished', () => step(2)),
				Havel.toArray(lines => {
					assert.deepEqual(2, lines.length);
					step(3)
				}).on('finished', () => step(4))
			).on('finished', () => step(5, done))
		})
	})

	describe('split() | join()', () => {
		it('output === input', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.split().on('finished', () => step(2)),
				Havel.join().on('finished', () => step(3)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					step(4)
				}).on('finished', () => step(5))
			).on('finished', () => step(6, done))
		})
	})

	describe('toBase64()', () => {
		it('correct conversion', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.toBase64().on('finished', () => step(2)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('base64')));
					step(3)
				}).on('finished', () => step(4))
			).on('finished', () => step(5, done))
		})
	})

	describe('toHex()', () => {
		it('correct conversion', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
				Havel.toHex().on('finished', () => step(2)),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('hex')));
					step(3)
				}).on('finished', () => step(4))
			).on('finished', () => step(5, done))
		})
	})
})
