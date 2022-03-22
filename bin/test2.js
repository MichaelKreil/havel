"use strict"

const Havel = require('../');

Havel.pipeline()
	.fromBuffer(Buffer.alloc(1024*1024))

	.spawn('head', ['-c', 4096])
	//.dump()
	.toBuffer(bufferOut => console.log(bufferOut.length))
