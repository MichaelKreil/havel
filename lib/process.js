'use strict'

module.exports = Havel => {
	const child_process = require('child_process');

	Havel.registerNodeFactoryStream('compressXZ', (opt = {}) => spawn(
		'xz',
		[
			'--compress',
			'-'+(opt.level ?? 9),
			opt.extreme && '--extreme',
			'--threads='+(opt.threads ?? 1),
		].filter(a => a)
	))

	Havel.registerNodeFactoryStream('decompressXZ', (opt = {}) => spawn(
		'xz',
		[
			'--decompress',
			'--threads='+(opt.threads ?? 1),
		]
	))

	Havel.registerNodeFactoryStream('spawn', spawn)

	async function spawn(cmd, args) {
		const process = child_process.spawn(cmd, args, { highWaterMark:1024*1024 });
		return {
			writable: process.stdin,
			readable: process.stdout,
		}
	}
}


