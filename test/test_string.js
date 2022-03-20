"use strict"

const Havel = require('../');
const assert = require('assert');

let text = [];
for (let i = 0; i < 65535; i++) text[i] = i;
text = String.fromCharCode(...text);
let bufferIn = Buffer.from(text);

describe('string', () => {

	require('./helper.js').checkCompleteness('../lib/string.js', 'split,join,toBase64,toHex');

	describe('split()', () => {
		it('correct number of lines', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.split(),
				Havel.toArray(lines => {
					assert.deepEqual(2, lines.length);
					done();
				})
			])
		})
	})

	describe('split() | join()', () => {
		it('output === input', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.split(),
				Havel.join(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					done();
				})
			])
		})
	})

	describe('toBase64()', () => {
		it('correct conversion', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.toBase64(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('base64')));
					done();
				})
			])
		})
	})

	describe('toHex()', () => {
		it('correct conversion', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.toHex(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferOut, Buffer.from(bufferIn.toString('hex')));
					done();
				})
			])
		})
	})
})
