'use strict'

module.exports = Havel => {
	const os = require('os');
	const child_process = require('child_process');
	const stream = require('node:stream');

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
		].filter(a => a)
	))

	Havel.registerNodeFactoryStream('spawn', (cmd, args) => spawn(cmd, args));

	function spawn(cmd, args) {
		let name = `spawn (${cmd}${args ? ' '+args.join(' ') : ''}):`;
		console.log({cmd, args});
		const process = child_process.spawn(cmd, args, { highWaterMark:1024*1024 });

		process.on('exit',  (c,s) => { if (c) console.error(name, 'exit', c, s) });
		process.on('close', (c,s) => { if (c) console.error(name, 'close', c, s) });
		process.on('error', e => { throw e });
		process.stderr.on('data', data => console.error(name, 'stderr', data.toString()))

		return stream.Duplex.from({
			writable:process.stdin,
			readable:process.stdout,
		})
	}
}
