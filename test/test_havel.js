'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');

describe('havel', () => {
	describe('pipeline', () => {
		it('should work without error', () => {
			Havel.pipeline().fromArray([1,2,3]).drain();
		})
		it('should finish', done => {
			Havel.pipeline().fromArray([1,2,3]).drain().finished(done);
		})
	})
})
