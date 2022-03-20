"use strict"

module.exports = Havel => {
	const os = require('os');
	const duplexify = require('duplexify');
	const child_process = require('child_process');

	return Object.assign(Havel, {
		compressXZ,
		decompressXZ,
		spawn,
	})

	function compressXZ(opt = {}) {
		return spawn(
			'xz',
			[
				'--compress',
				'-'+(opt.level ?? 9),
				'--threads='+(opt.threads ?? os.cpus().length),
			],
			'xzCompress'
		)
	}

	function decompressXZ(opt = {}) {
		return spawn(
			'xz',
			[
				'--decompress',
				'--threads='+(opt.threads ?? os.cpus().length),
			],
			'xzDecompress'
		)
	}

	function spawn(cmd, args, name) {
		name ??= cmd;
		const process = child_process.spawn(cmd, args, { highWaterMark:1024*1024 });

		process.on('exit',  (c,s) => { if (c) console.error(name+': exit',c,s) });
		process.on('close', (c,s) => { if (c) console.error(name+': close',c,s) });
		process.on('error', e => { throw e });
		process.stderr.on('data', data => console.error(name+':',data.toString()))

		let stream = duplexify(process.stdin, process.stdout);

		return Havel(stream, {type:'stream', name});
	}
}
