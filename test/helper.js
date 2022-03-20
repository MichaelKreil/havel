"use strict"

const assert = require('assert');

module.exports = {
	checkCompleteness,
}

function checkCompleteness(moduleName, functionNames) {
	it('check completeness', done => {
		functionNames = functionNames.split(',');
		let object = require(moduleName)({});
		Object.entries(object).forEach(([key,func]) => {
			assert.ok(functionNames.includes(key), `function ${key} is not tested yet`)
			assert.ok(typeof func === 'function', `function ${key} is not a function?`)
		})
		functionNames.forEach(functionName => {
			assert.ok(object[functionName], `function ${functionName} is missing`)
		})
		done();
	})
}
