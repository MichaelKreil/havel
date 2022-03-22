'use strict'

module.exports = Havel => {
	const os = require('os');
	const child_process = require('child_process');

	Havel.registerNode('compressXZ', (opt = {}) => spawn(
		'xz',
		[
			'--compress',
			'-'+(opt.level ?? 9),
			'--threads='+(opt.threads ?? os.cpus().length),
		],
		'xzCompress'
	))

	Havel.registerNode('decompressXZ', (opt = {}) => spawn(
		'xz',
		[
			'--decompress',
			'--threads='+(opt.threads ?? os.cpus().length),
		],
		'xzDecompress'
	))

	Havel.registerNode('spawn', (cmd, args, name) => spawn(cmd, args, name));

	function spawn(cmd, args, name) {
		name ??= cmd;
		const process = child_process.spawn(cmd, args, { highWaterMark:1024*1024 });

		process.on('exit',  (c,s) => { if (c) console.error(name+': exit',c,s) });
		process.on('close', (c,s) => { if (c) console.error(name+': close',c,s) });
		process.on('error', e => { throw e });
		process.stderr.on('data', data => console.error(name+':',data.toString()))

		return Havel.wrapStream(process.stdin, process.stdout, {type:'stream', name});
	}
}
