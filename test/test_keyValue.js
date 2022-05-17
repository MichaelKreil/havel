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
for (let i = 0; i < 128; i++) {
	listIn[i] = new Havel.KeyValue(
		getLetters(8),
		Object.fromEntries(Array.from({length:4}, () =>
			[ getLetters(Math.floor(Math.random()*10+1)), Math.random() ],
		))
	)
}

describe('keyValue', () => {

	describe('keyValueToBuffer | bufferToKeyValue', () => {
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

	describe('keyValueCheckOrder', () => {
		it('should be valid', done => {
			Havel.pipeline()
				.fromArray([-1,0,1,2,3].map(id => new Havel.KeyValue(id,'nix')))
				.keyValueCheckOrder()
				.drain().finished(done)
		})
		it('should be invalid', done => {
			Havel.pipeline()
				.fromArray([-1,0,0,2,3].map(id => new Havel.KeyValue(id,'nix')))
				.keyValueCheckOrder(done)
				.drain()
		})
	})

	describe('keyValueToStream | streamToKeyValue', () => {
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

	describe('keyValueMerge', () => {
		it('should works', done => {
			Havel.pipeline()
				.fromArray([0,1,2,4,5].map(id => new Havel.KeyValue(id,'nix')))
				.keyValueMerge(
					Havel.pipeline().fromArray([0,1,3,4].map(id => new Havel.KeyValue(id,'nix'))),
					(e1,e2) => {
						if (e1 && e2 && (e1.key !== e2.key)) assert.fail('if both entries, then their keys should be equal');
						return e1 || e2;
					}
				)
				.keyValueCheckOrder((a,b) => a < b)
				.drain().finished(done)
		})
	})
})
