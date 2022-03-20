"use strict"

const assert = require('assert');

module.exports = {
	checkCompleteness,
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
