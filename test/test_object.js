'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

describe('object', () => {

	let arrayIn = [];
	for (let i = 0; i < 256; i++) arrayIn[i] = {a:Math.random(), b:Math.random().toString()}

	describe('objectToJSON() | JSONToObject()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.objectToJSON()
				.finished(() => step(2))
				.JSONToObject()
				.finished(() => step(3))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})

	describe('serializeObject() | deserializeObject()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline()
				.fromArray(arrayIn)
				.finished(() => step(1))
				.serializeObject()
				.finished(() => step(2))
				.deserializeObject()
				.finished(() => step(3))
				.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(4)
				})
				.finished(() => step(5, done))
		})
	})
});
