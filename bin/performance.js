'use strict'

const Havel = require('../');
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');

const fileSize = 200*1024*1024;
const tempFilename1 = resolve(os.tmpdir(), 'test1.tmp');
const tempFilename2 = resolve(os.tmpdir(), 'test2.tmp');
fs.writeFileSync(tempFilename1, Buffer.alloc(fileSize));

let timeStart = Date.now();

Havel.pipeline()
	.readFile(tempFilename1)
	.streamToChunks(1024*1024)
	.boxesToStream()
	.writeFile(tempFilename2)
	.finished(() => {
		let timeEnd = Date.now();
		fs.rmSync(tempFilename1);
		fs.rmSync(tempFilename2);
		console.log((fileSize/(timeEnd-timeStart)/(1024*1.024)).toFixed(1)+' MB/s');
	})
