'use strict'

/* global describe, it */

const assert = require('assert');

module.exports = {
	stepper,
}

function stepper() {
	let stepExpected = 1;
	return step;
	function step(stepNew, callback) {
		//console.log('step', stepExpected);
		process.stderr.write('…'+stepNew);
		assert.equal(stepNew, stepExpected, `expected step ${stepExpected}, but got step ${stepNew}`);
		stepExpected++;
		if (callback) {
			process.stderr.write('\n');
			callback();
		}
	}
}
