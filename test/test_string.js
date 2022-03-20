"use strict"

const Havel = require('../');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');

let text = [];
for (let i = 0; i < 65535; i++) text[i] = i;
text = String.fromCharCode(...text);
let bufferIn = Buffer.from(text);

describe('string', () => {

	describe('split()', () => {
		it('correct number of lines', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.split(),
				Havel.toArray(lines => {
					assert.deepEqual(2, lines.length);
					done();
				})
			])
		})
	})

	describe('split() | join()', () => {
		it('output === input', done => {
			Havel.pipeline([
				Havel.fromBuffer(bufferIn),
				Havel.split(),
				Havel.join(),
				Havel.toBuffer(bufferOut => {
					assert.deepEqual(bufferIn, bufferOut);
					done();
				})
			])
		})
	})
})
