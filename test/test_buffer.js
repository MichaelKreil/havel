"use strict"

const Havel = require('../');
const assert = require('assert');
const helper = require('./helper.js');

Havel.pipeline(Havel.noiseBuffers(1024, 1024), Havel.toArray(buffersIn => {

	let bufferIn = Buffer.concat(buffersIn);

	describe('buffer', () => {

		helper.checkCompleteness('../lib/buffer.js',
			'noiseBuffers,fromBuffer,toBuffer,streamToChunks,boxesToStream,streamToBoxes'
		);

		describe('noiseBuffers()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline(
					Havel.noiseBuffers(1024, 4096).on('finished', () => step(1)),
					Havel.dump().on('finished', () => step(2))
				).on('finished', () => step(3, done))
			})
		})

		describe('fromBuffer() | toBuffer()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline(
					Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
					Havel.toBuffer(bufferOut => {
						assert.deepEqual(bufferIn, bufferOut);
						step(2)
					}).on('finished', () => step(3))
				).on('finished', () => step(4, done))
			})
		})

		describe('streamToChunks()', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline(
					Havel.fromBuffer(bufferIn).on('finished', () => step(1)),
					Havel.streamToChunks(4096).on('finished', () => step(2)),
					Havel.toArray(buffersOut => {
						for (let buffer of buffersOut) assert.equal(buffer.length, 4096);
						assert.deepEqual(bufferIn, Buffer.concat(buffersOut));
						step(3);
					}).on('finished', () => step(4))
				).on('finished', () => step(5, done))
			})
		})

		describe('boxesToStream | streamToBoxes', () => {
			it('should work without errors', done => {
				let step = helper.stepper();
				Havel.pipeline(
					Havel.fromArray(buffersIn).on('finished', () => step(1)),
					Havel.boxesToStream().on('finished', () => step(2)),
					Havel.streamToBoxes().on('finished', () => step(3)),
					Havel.toArray(buffersOut => {
						assert.deepEqual(buffersIn, buffersOut);
						step(4)
					}).on('finished', () => step(5))
				).on('finished', () => step(6, done))
			})
		})
	})
}))
