"use strict"

module.exports = Havel => {
	const zlib = require('zlib');

	return Object.assign(Havel, {
		compressGzip,
		decompressGzip,
		compressBrotli,
		decompressBrotli,
	})

	function compressGzip(level = zlib.constants.Z_BEST_COMPRESSION) {
		return Havel(
			zlib.createGzip({level}),
			{type:'stream', name:'compressGzip'}
		)
	}

	function decompressGzip() {
		return Havel(
			zlib.createGunzip(),
			{type:'stream', name:'decompressGzip'}
		)
	}

	function compressBrotli(level = zlib.constants.BROTLI_MAX_QUALITY) {
		return Havel(
			zlib.createBrotliCompress({params:{[zlib.constants.BROTLI_PARAM_QUALITY]:level}}),
			{type:'stream', name:'compressBrotli'}
		)
	}

	function decompressBrotli() {
		return Havel(
			zlib.createBrotliDecompress(),
			{type:'stream', name:'decompressBrotli'}
		)
	}
}
