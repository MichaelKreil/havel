"use strict"

const Havel = require('../');
const assert = require('assert');

Havel.pipeline([Havel.noiseBuffers(1024, 1024), Havel.toArray(buffersIn => {

	require('./helper.js').checkCompleteness('../lib/buffer.js', 'noiseBuffers,fromBuffer,toBuffer,streamToChunks,boxesToStream,streamToBoxes');

	let bufferIn = Buffer.concat(buffersIn);

	describe('buffer', () => {
		describe('noiseBuffers()', () => {
			it('should work without errors', done =>
				Havel.pipeline([
					Havel.noiseBuffers(1024, 4096),
					Havel.dump()
				], done)
			)
		})

		describe('fromBuffer() | toBuffer()', () => {
			it('should work without errors', done =>
				Havel.pipeline([
					Havel.fromBuffer(bufferIn),
					Havel.toBuffer(bufferOut => {
						assert.deepEqual(bufferIn, bufferOut);
						done();
					})
				])
			)
		})

		describe('streamToChunks()', () => {
			it('should work without errors', done =>
				Havel.pipeline([
					Havel.fromBuffer(bufferIn),
					Havel.streamToChunks(4096),
					Havel.toArray(buffersOut => {
						for (let buffer of buffersOut) assert.equal(buffer.length, 4096);
						assert.deepEqual(bufferIn, Buffer.concat(buffersOut));
						done();
					})
				])
			)
		})

		describe('boxesToStream | streamToBoxes', () => {
			it('should work without errors', done =>
				Havel.pipeline([
					Havel.fromArray(buffersIn),
					Havel.boxesToStream(),
					Havel.streamToBoxes(),
					Havel.toArray(buffersOut => {
						assert.deepEqual(buffersIn, buffersOut);
						done();
					})
				])
			)
		})
	})
})])
