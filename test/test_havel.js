'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');

describe('havel', () => {
	/*
	describe('wrapFunc', () => {
		it('should work without error', () => {
			Havel.wrapFunc({func:function () {}});
		})
	})
	describe('registerNode', () => {
		it('should work without error', () => {
			Havel.registerNode('testing1', Havel.wrapFunc({func:function () {}}));
		})
	})
	describe('wrapStream', () => {
		it('should work without error', () => {
			Havel.wrapStream(process.stdin, process.stdout);
		})
	})
	describe('compose', () => {
		it('should work without error', () => {
			Havel.registerNode('testing2', () => Havel.compose(p => p.keyValueToBuffer().boxesToStream()));
		})
	})
	*/
	describe('pipeline', () => {
		it('should work without error', () => {
			Havel.pipeline().fromArray([1,2,3]).drain();
		})
		it('should finish', done => {
			Havel.pipeline().fromArray([1,2,3]).drain().finished(done);
		})
	})
})
