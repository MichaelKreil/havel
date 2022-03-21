"use strict"

module.exports = Havel => {
	const zlib = require('zlib');

	return Object.assign(Havel, {
		compressGzip,
		decompressGzip,
		compressBrotli,
		decompressBrotli,
	})

	function compressGzip(opt = {}) {
		return Havel.wrapStream(
			zlib.createGzip({level:opt.level ?? zlib.constants.Z_BEST_COMPRESSION}),
			{ type:'stream', name:'compressGzip'}
		)
	}

	function decompressGzip() {
		return Havel.wrapStream(
			zlib.createGunzip(),
			{ type:'stream', name:'decompressGzip'}
		)
	}

	function compressBrotli(opt = {}) {
		return Havel.wrapStream(
			zlib.createBrotliCompress({params:{
				[zlib.constants.BROTLI_PARAM_QUALITY]:opt.level ?? zlib.constants.BROTLI_MAX_QUALITY
			}}),
			{ type:'stream', name:'compressBrotli'}
		)
	}

	function decompressBrotli() {
		return Havel.wrapStream(
			zlib.createBrotliDecompress(),
			{ type:'stream', name:'decompressBrotli'}
		)
	}
}
