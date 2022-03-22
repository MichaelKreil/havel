"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

Havel.pipeline().noiseBuffers(1024, 1024).toArray(buffersIn => {

	let bufferIn = Buffer.concat(buffersIn);

	describe('buffer', () => {

		helper.checkCompleteness('../lib/buffer.js',
			'noiseBuffers,fromBuffer,toBuffer,streamToChunks,boxesToStream,streamToBoxes'
		);

		describe('noiseBuffers()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline()
					.noiseBuffers(1024, 4096)
					.finished(() => step(1))
					.dump()
					.finished(() => step(2, done))
			})
		})

		describe('fromBuffer() | toBuffer()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline()
					.fromBuffer(bufferIn)
					.finished(() => step(1))
					.toBuffer(bufferOut => {
						assert.deepEqual(bufferIn, bufferOut);
						step(2)
					})
					.finished(() => step(3, done))
			})
		})

		describe('streamToChunks()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline()
					.fromBuffer(bufferIn)
					.finished(() => step(1))
					.streamToChunks(4096)
					.finished(() => step(2))
					.toArray(buffersOut => {
						for (let buffer of buffersOut) assert.equal(buffer.length, 4096);
						assert.deepEqual(bufferIn, Buffer.concat(buffersOut));
						step(3);
					})
					.finished(() => step(4, done))
			})
		})

		describe('boxesToStream | streamToBoxes', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline()
					.fromArray(buffersIn)
					.finished(() => step(1))
					.boxesToStream()
					.finished(() => step(2))
					.streamToBoxes()
					.finished(() => step(3))
					.toArray(buffersOut => {
						assert.deepEqual(buffersIn, buffersOut);
						step(4)
					})
					.finished(() => step(5, done))
			})
		})
	})
})
