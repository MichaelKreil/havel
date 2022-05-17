'use strict'

const Havel = require('../index.js');

Havel.pipeline()
	.readFile('../data/friends_10000.tsv.xz', { showProgress: true })
	.decompressXZ()
	.split()
	.map(line => {
		line = line.split('\t');
		return new Havel.KeyValue(line[0], JSON.parse(line[1]))
	})
	.eachPairWise((e1, e2) => {
		//console.log(e1,e2);
		if (e1.key.length < e2.key.length) return;
		if ((e1.key.length > e2.key.length) || (e1.key >= e2.key)) {
			throw Error(`${JSON.stringify(e1.key)} >= ${JSON.stringify(e2.key)}`);
		}
	})
	.keyValueToStream()
	.writeFile('../data/friends_10000.bin')
	.finished(() => console.log('finished'))
