"use strict"

const Havel = require('../');
const assert = require('assert');

describe('basics', () => {
	describe('#fromArray() | toArray()', () => {
		it('should return input array', () => {
			let arrayIn = Array.from({length: 10000}, () => Math.random());

			Havel.pipeline(
				Havel.fromArray(arrayIn),
				Havel.toArray(arrayOut => assert.deepEqual(arrayIn, arrayOut))
			)
		});
	});
});
