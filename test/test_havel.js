'use strict'

/* global describe, it */

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

describe('havel', () => {
	describe('detectType', () => {
		it('should detect string', () => { assert.equal(Havel.detectType('hallo'), 'string') });
		it('should detect object', () => { assert.equal(Havel.detectType({}), 'object') });
		it('should detect keyValue', () => { assert.equal(Havel.detectType(new Havel.KeyValue(1,2)), 'keyValue') });
		it('should detect buffer', () => { assert.equal(Havel.detectType(Buffer.alloc(12)), 'buffer') });
	})
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
	describe('pipeline', () => {
		it('should work without error', () => {
			Havel.pipeline().fromArray([1,2,3]).dump();
		})
		it('should finish', done => {
			Havel.pipeline().fromArray([1,2,3]).dump().finished(done);
		})
	})
})
