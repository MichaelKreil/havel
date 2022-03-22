"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

describe('object', () => {

	helper.checkCompleteness('../lib/object.js',
		'objectToJSON,JSONToObject,serializeObject,deserializeObject'
	);

	let arrayIn = [];
	for (let i = 0; i < 256; i++) arrayIn[i] = {a:Math.random(), b:Math.random().toString()}

	describe('objectToJSON() | JSONToObject()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline([
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.objectToJSON().on('finished', () => step(2)),
				Havel.JSONToObject().on('finished', () => step(3)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(4)
				}).on('finished', () => step(5))
			], () => step(6, done))
		})
	})

	describe('serializeObject() | deserializeObject()', () => {
		it('should work without errors', done => {
			let step = helper.stepper();
			Havel.pipeline([
				Havel.fromArray(arrayIn).on('finished', () => step(1)),
				Havel.serializeObject().on('finished', () => step(2)),
				Havel.deserializeObject().on('finished', () => step(3)),
				Havel.toArray(arrayOut => {
					assert.deepEqual(arrayIn, arrayOut);
					step(4)
				}).on('finished', () => step(5))
			], () => step(6, done))
		})
	})
});
