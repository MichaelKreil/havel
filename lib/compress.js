'use strict'

module.exports = Havel => {
	const zlib = require('zlib');

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function compressGzip
	 * @desc compresses a stream with gzip
	 * @param {Object} opt e.g.: { level: 9 }
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('compressGzip', (opt = {}) =>
		zlib.createGzip({ level: opt.level ?? zlib.constants.Z_BEST_COMPRESSION })
	)

	/**
	 * @function decompressGzip
	 * @desc decompresses a stream with gzip
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('decompressGzip', () =>
		zlib.createGunzip()
	)

	/**
	 * @function compressBrotli
	 * @desc compresses a stream with brotli
	 * @param {Object} opt e.g.: { level: 11 }
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('compressBrotli', (opt = {}) =>
		zlib.createBrotliCompress({
			params: {
				[zlib.constants.BROTLI_PARAM_QUALITY]: opt.level ?? zlib.constants.BROTLI_MAX_QUALITY
			}
		})
	)

	/**
	 * @function decompressBrotli
	 * @desc decompresses a stream with brotli
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('decompressBrotli', () =>
		zlib.createBrotliDecompress()
	)
}
