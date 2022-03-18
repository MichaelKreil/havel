"use strict"

const havel = require('../index.js');

havel.pipeline(
	havel.readFile('../data/friends_10000.tsv.xz', {
		showProgress: true
	}),
	havel.decompressXZ(),
	havel.split(),
	havel.map(line => {
		line = line.split('\t');
		let key = line[0];
		let value = JSON.parse(line[1]);
		return new havel.KeyValue(key, value)
	}, {
		outputType: 'keyValue'
	}),
	havel.eachPairWise((e1, e2) => {
		if (e1.key.length < e2.key.length) return;
		if ((e1.key.length > e2.key.length) || (e1.key >= e2.key)) {
			throw Error(`${JSON.stringify(e1.key)} >= ${JSON.stringify(e2.key)}`);
		}
	}),
	//havel.keyValueToBuffer(),
	//havel.keyValueToStream(),
	//havel.log(),
	//havel.streamToKeyValue(),
	//havel.eachPromise(e => e.getValuePromise()),
	//havel.log(),
	havel.dump(),
	//havel.writeFile('../data/friends.bin'),
	() => console.log('finished')
)
