"use strict"

const Havel = require('../');
const assert = require('assert');

describe('basics', () => {
	let arrayIn = Array.from({length: 1000}, () => Math.random());

	describe('fromArray() | toArray()', () => {
		it('should return input array', done => {
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut)
					done();
				})
			])
		})
	})

	describe('dump()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.dump()
			], done)
		)
	})

	describe('each()', () => {
		it('should return input array', done => {
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.each(e => 'e'),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					done();
				})
			])
		})
	})

	describe('eachPairWise()', () => {
		it('should return input array', done => {
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.eachPairWise(e => 'e'),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					done();
				})
			])
		})
	})

	describe('head()', () => {
		it('should return first 100 elements of input array', done => {
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.head(100),
				Havel.toArray(arrayOut => {
					assert.equal(arrayOut.length, 100)
					assert.deepEqual(arrayIn.slice(0,100), arrayOut)
					done();
				})
			])
		})
	})

	describe('log()', () => {
		it('should work without errors', done => {
			Havel.pipeline([
				Havel.fromArray(['test']),
				Havel.log(Havel.dump().stream),
				Havel.dump()
			], done)
		})
	})

	describe('map()', () => {
		it('should return input array', done => {
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.map(v => v*2),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn.map(v => v*2), arrayOut)
					done();
				})
			])
		})
	})
});
