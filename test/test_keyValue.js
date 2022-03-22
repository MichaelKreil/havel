'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

const getLetters = n => {
	let chars = Array.from({length:n}, () => Math.floor(97+Math.random()*26));
	return String.fromCharCode(...chars)
}
const listIn = [];
for (let i = 0; i < 256; i++) {
	listIn[i] = new Havel.KeyValue(
		getLetters(8),
		Object.fromEntries(Array.from({length:4}, () =>
			[ getLetters(Math.floor(Math.random()*10+1)), Math.random() ],
		))
	)
}

describe('keyValue', () => {

	helper.checkCompleteness('../lib/keyValue.js',
		'bufferToKeyValue,keyValueToBuffer,keyValueToStream,streamToKeyValue'
	);

	describe('keyValueToBuffer() | bufferToKeyValue', () => {
		it('input === output', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(listIn)
				.finished(() => step(1))
				.keyValueToBuffer()
				.finished(() => step(2))
				.bufferToKeyValue()
				.finished(() => step(3))
				.toArray(listOut => {
					assert.deepEqual(listIn, listOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})

	describe('keyValueToStream() | streamToKeyValue', () => {
		it('input === output', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(listIn)
				.finished(() => step(1))
				.keyValueToStream()
				.finished(() => step(2))
				.streamToKeyValue()
				.finished(() => step(3))
				.toArray(listOut => {
					assert.deepEqual(listIn, listOut);
					step(4);
				})
				.finished(() => step(5, done))
		})
	})
})
