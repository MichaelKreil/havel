'use strict'

module.exports = Havel => {
	const zlib = require('zlib');

	Havel.registerNode('compressGzip', (opt = {}) => Havel.wrapStream(
		zlib.createGzip({level:opt.level ?? zlib.constants.Z_BEST_COMPRESSION}),
		{ type:'stream' }
	))

	Havel.registerNode('decompressGzip', () => Havel.wrapStream(
		zlib.createGunzip(),
		{ type:'stream' }
	))

	Havel.registerNode('compressBrotli', (opt = {}) => Havel.wrapStream(
		zlib.createBrotliCompress({params:{
			[zlib.constants.BROTLI_PARAM_QUALITY]:opt.level ?? zlib.constants.BROTLI_MAX_QUALITY
		}}),
		{ type:'stream' }
	))

	Havel.registerNode('decompressBrotli', () => Havel.wrapStream(
		zlib.createBrotliDecompress(),
		{ type:'stream' }
	))
}
