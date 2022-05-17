'use strict'

const Havel = require('../');

Havel.pipeline()
	.fromArray([-1,0,0,2,3].map(id => new Havel.KeyValue(id,'nix')))
	.keyValueCheckOrder((a,b) => a < b)
	.keyValueToStream()
	.drain()
