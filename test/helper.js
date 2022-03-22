"use strict"

const assert = require('assert');

module.exports = {
	checkCompleteness,
	stepper,
}

function checkCompleteness(moduleName, functionNames) {
	describe('check completeness', () => {
		functionNames = functionNames.split(',');

		let object = require(moduleName)({});

		Object.entries(object).forEach(([key,func]) => {
			if (typeof func !== 'function') return;
			if (functionNames.includes(key)) return;
			it(`function ${key} is not included in tests yet`)
		})

		functionNames.forEach(functionName => {
			it(`function ${functionName}`, () => {
				assert.ok(object[functionName], 'must be a defined');
				assert.equal(typeof object[functionName], 'function', 'must be a function');
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
