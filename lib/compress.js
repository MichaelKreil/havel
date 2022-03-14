"use strict"

module.exports = havel => {
	const zlib = require('zlib');
	
	return Object.assign(havel, {
		compressGzip,
		decompressGzip,
		compressBrotli,
		decompressBrotli,
	})

	function compressGzip(level = zlib.constants.Z_BEST_COMPRESSION) {
		return havel.wrapStream(zlib.createGzip({level}), {type:'stream'});
	}

	function decompressGzip() {
		return havel.wrapStream(zlib.createGunzip(), {type:'stream'});
	}

	function compressBrotli(level = zlib.constants.BROTLI_MAX_QUALITY) {
		return havel.wrapStream(zlib.createBrotliCompress({params:{[zlib.constants.BROTLI_PARAM_QUALITY]:level}}), {type:'stream'});
	}

	function decompressBrotli() {
		return havel.wrapStream(zlib.createBrotliDecompress(), {type:'stream'});
	}
}
