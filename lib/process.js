'use strict'

module.exports = Havel => {
	const child_process = require('child_process');

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function compressXZ
	 * @desc compresses a stream with XZ
	 * @param {Object} options e.g. {level:9, extreme:true, threads:0}
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('compressXZ', (options = {}) => spawn(
		'xz',
		[
			'--compress',
			'-' + (options.level ?? 9),
			options.extreme && '--extreme',
			'--threads=' + (options.threads ?? 1),
		].filter(a => a)
	))

	/**
	 * @function decompressXZ
	 * @desc decompresses a stream with XZ
	 * @param {Object} options e.g. {threads:0}
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('decompressXZ', (options = {}) => spawn(
		'xz',
		[
			'--decompress',
			'--threads=' + (options.threads ?? 1),
		]
	))

	/**
	 * @function spawn
	 * @desc pipes data to a child process
	 * @param {String} cmd e.g. 'head'
	 * @param {Number} args e.g. ['-c', 1000]
	 * @memberof Pipeline
	 * @instance
	 */
	function spawn(cmd, args) {
		const process = child_process.spawn(cmd, args, { highWaterMark: 1024 * 1024 });
		return {
			writable: process.stdin,
			readable: process.stdout,
		}
	}
	Havel.registerNodeFactoryStream('spawn', spawn)
}


