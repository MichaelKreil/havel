"use strict"

const Havel = require('../');
const assert = require('assert');

const getLetters = n => {
	let chars = Array.from({length:n}, v => Math.floor(97+Math.random()*26));
	return String.fromCharCode(...chars)
}
const listIn = [];
for (let i = 0; i < 256; i++) {
	listIn[i] = new Havel.KeyValue(
		getLetters(8),
		Object.fromEntries(Array.from({length:4}, v =>
			[ getLetters(Math.floor(Math.random()*10+1)), Math.random() ],
		))
	)
}

describe('keyValue', () => {

	require('./helper.js').checkCompleteness('../lib/keyValue.js',
		'bufferToKeyValue,keyValueToBuffer,keyValueToStream,streamToKeyValue,KeyValue'
	);

		describe('keyValueToBuffer() | bufferToKeyValue', () => {
			it('input === output', done => {
				Havel.pipeline([
					Havel.fromArray(listIn),
					Havel.keyValueToBuffer(),
					Havel.bufferToKeyValue(),
					Havel.toArray(listOut => {
						assert.deepEqual(listIn, listOut);
						done();
					})
				])
			})
		})

		describe('keyValueToStream() | streamToKeyValue', () => {
			it('input === output', done => {
				Havel.pipeline([
					Havel.fromArray(listIn),
					Havel.keyValueToStream(),
					Havel.streamToKeyValue(),
					Havel.toArray(listOut => {
						assert.deepEqual(listIn, listOut);
						done();
					})
				])
			})
		})
/*

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
	*/
})
