"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

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

	helper.checkCompleteness('../lib/keyValue.js',
		'bufferToKeyValue,keyValueToBuffer,keyValueToStream,streamToKeyValue,KeyValue'
	);

	describe('keyValueToBuffer() | bufferToKeyValue', () => {
		it('input === output', done => {
			let step = helper.stepper();
			Havel.pipeline([
				Havel.fromArray(listIn).on('finished', () => step(1)),
				Havel.keyValueToBuffer().on('finished', () => step(2)),
				Havel.bufferToKeyValue().on('finished', () => step(3)),
				Havel.toArray(listOut => {
					assert.deepEqual(listIn, listOut);
					step(4)
				}).on('finished', () => step(5))
			], () => step(6, done))
		})
	})

	describe('keyValueToStream() | streamToKeyValue', () => {
		it('input === output', done => {
			let step = helper.stepper();
			Havel.pipeline([
				Havel.fromArray(listIn).on('finished', () => step(1)),
				Havel.keyValueToStream().on('finished', () => step(2)),
				Havel.streamToKeyValue().on('finished', () => step(3)),
				Havel.toArray(listOut => {
					assert.deepEqual(listIn, listOut);
					step(4);
				}).on('finished', () => step(5))
			], () => step(6, done))
		})
	})
})
