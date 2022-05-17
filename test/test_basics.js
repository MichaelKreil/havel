'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

describe('basics', () => {
	let arrayIn = Array.from({length: 1000}, () => Math.random());

	describe('fromArray() | toArray()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(2);
				})
				.finished(() => step(3, done))
		})
	})

	describe('drain()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.drain()
				.finished(() => step(2, done));
		})
	})

	describe('forEach()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.forEach(() => 'e')
				.finished(() => step(2))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(3);
				})
				.finished(() => step(4, done))
		})
	})

	describe('forEachPairWise()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.forEachPairWise((a,b) => {
					assert.ok(a, 'first value was not set');
					assert.ok(b, 'second value was not set');
				})
				.finished(() => step(2))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(3);
				})
				.finished(() => step(4, done))
		})
	})

	describe('head()', () => {
		it('should return first 100 elements of input array', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => assert.fail('should never happen'))
				.head(100)
				.finished(() => step(1))
				.toArray(arrayOut => {
					assert.equal(arrayOut.length, 100)
					assert.deepEqual(arrayIn.slice(0,100), arrayOut)
					step(2);
				})
				.finished(() => step(3, done))
		})
	})

	describe('log()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(['test'])
				.finished(() => step(1))
				.log()
				.finished(() => step(2))
				.drain()
				.finished(() => step(3, done))
		})
	})

	describe('map()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.map(v => v*2)
				.finished(() => step(2))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn.map(v => v*2), arrayOut)
					step(3);
				})
				.finished(() => step(4, done))
		})
	})
});
