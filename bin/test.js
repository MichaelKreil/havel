"use strict"

const streams = require('../index.js');

streams.pipeline(
	streams.readFile(__filename),
	streams.splitLines(),
	streams.map((t,i) => streams.KeyValue(i,t.split(' ')), {inputType:'string', outputType:'keyValue'}),
	streams.keyValueToStream(),
	//streams.compressBrotli(),
	//streams.decompressBrotli(),
	streams.streamToKeyValue(),
	streams.each(async o => {
		console.log('hallo')
		console.log(await o.toString());
	}, {inputType:'keyValue', async:true}),
	() => console.log('finished')
)
