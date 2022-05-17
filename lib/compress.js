'use strict'

module.exports = Havel => {
	const zlib = require('zlib');

	Havel.registerNodeFactoryStream('compressGzip', (opt = {}) =>
		zlib.createGzip({level:opt.level ?? zlib.constants.Z_BEST_COMPRESSION})
	)

	Havel.registerNodeFactoryStream('decompressGzip', () =>
		zlib.createGunzip()
	)

	Havel.registerNodeFactoryStream('compressBrotli', (opt = {}) =>
		zlib.createBrotliCompress({params:{
			[zlib.constants.BROTLI_PARAM_QUALITY]:opt.level ?? zlib.constants.BROTLI_MAX_QUALITY
		}})
	)

	Havel.registerNodeFactoryStream('decompressBrotli', () =>
		zlib.createBrotliDecompress()
	)
}
