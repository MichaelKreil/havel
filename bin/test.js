"use strict"

const Havel = require('../index.js');

Havel.pipeline([
	Havel.readFile('../data/friends_10000.tsv.xz', { showProgress: true }),
	Havel.decompressXZ(),
	Havel.split(),
	Havel.map(line => {
		line = line.split('\t');
		let key = line[0];
		let value = JSON.parse(line[1]);
		return new Havel.KeyValue(key, value)
	}, {outputType:'keyValue'} ),
	Havel.eachPairWise((e1, e2) => {
		if (e1.key.length < e2.key.length) return;
		if ((e1.key.length > e2.key.length) || (e1.key >= e2.key)) {
			throw Error(`${JSON.stringify(e1.key)} >= ${JSON.stringify(e2.key)}`);
		}
	}),
	Havel.keyValueToStream(),
	Havel.writeFile('../data/friends_10000.bin'),
], () => console.log('finished'))
