"use strict"

const Havel = require('../');
const assert = require('assert');

describe('object', () => {
	let arrayIn = [];
	for (let i = 0; i < 256; i++) arrayIn[i] = {a:Math.random(), b:Math.random().toString()}

	describe('objectToJSON() | JSONToObject()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.objectToJSON(),
				Havel.JSONToObject(),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					done();
				})
			])
		)
	})

	describe('serializeObject() | deserializeObject()', () => {
		it('should work without errors', done =>
			Havel.pipeline([
				Havel.fromArray(arrayIn),
				Havel.serializeObject(),
				Havel.deserializeObject(),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					done();
				})
			])
		)
	})
});
