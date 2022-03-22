"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

describe('basics', () => {

	helper.checkCompleteness('../lib/basics.js',
		'dump,each,eachPairWise,fromArray,head,log,map,toArray'
	);

	let arrayIn = Array.from({length: 1000}, () => Math.random());

	describe('fromArray() | toArray()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(2);
				}).on('finished', () => step(3)),
			).on('finished', () => step(4, done))
		})
	})

	describe('dump()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.dump().on('finished', () => step(2))
			).on('finished', () => step(3, done))
		})
	})

	describe('each()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.each(e => 'e').on('finished', () => step(2)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(3);
				}).on('finished', () => step(4)),
			).on('finished', () => step(5, done))
		})
	})

	describe('eachPairWise()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.eachPairWise((a,b) => {
					assert.ok(a, 'first value was not set');
					assert.ok(b, 'second value was not set');
				}).on('finished', () => step(2)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(3);
				}).on('finished', () => step(4)),
			).on('finished', () => step(5, done))
		})
	})

	describe('head()', () => {
		it('should return first 100 elements of input array', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => assert.fail('should never happen')),
				Havel.head(100).on('finished', () => step(1)),
				Havel.toArray(arrayOut => {
					assert.equal(arrayOut.length, 100)
					assert.deepEqual(arrayIn.slice(0,100), arrayOut)
					step(2);
				}).on('finished', () => step(3))
			).on('finished', () => step(4, done))
		})
	})

	describe('log()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(['test']).on('finished', () => step(1)),
				Havel.log().on('finished', () => step(2)),
				Havel.dump().on('finished', () => step(3))
			).on('finished', () => step(4, done))
		})
	})

	describe('map()', () => {
		it('should return input array', done => {
			let step = helper.stepper();
			Havel.pipeline(
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.map(v => v*2).on('finished', () => step(2)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn.map(v => v*2), arrayOut)
					step(3);
				}).on('finished', () => step(4))
			).on('finished', () => step(5, done))
		})
	})
});
