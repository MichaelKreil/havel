'use strict'

/* global describe, it */

const assert = require('assert');

module.exports = {
	checkCompleteness,
	stepper,
}

function checkCompleteness(moduleName, functionNames) {
	describe('check completeness', () => {
		functionNames = functionNames.split(',');

		let nodes = [];
		require(moduleName)({registerNode: name => nodes.push(name)})

		nodes.forEach(name => {
			if (functionNames.includes(name)) return;
			it(`function ${name} is not included in tests yet`)
		})

		functionNames.forEach(name => {
			it(`function ${name}`, () => {
				assert.ok(nodes.includes(name), 'is not defined');
			})
		})
	})
}

function stepper() {
	let stepExpected = 1;
	return step;
	function step(stepNew, callback) {
		assert.equal(stepNew, stepExpected, `expected step ${stepExpected}, but got step ${stepNew}`);
		stepExpected++;
		if (callback) callback();
	}
}
