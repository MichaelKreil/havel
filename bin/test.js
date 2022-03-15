"use strict"

const havel = require('../index.js');

havel.pipeline(
	havel.readFile('../data/friends_100.tsv.xz'),
	havel.decompressXZ(),
	havel.split(),
	//havel.head(10),
	havel.map(line => havel.KeyValue(...line.split('\t')), {outputType:'keyValue'} ),
	havel.keyValueToStream(),
	havel.writeFile('../data/friends.bin'),
	() => console.log('finished')
)
