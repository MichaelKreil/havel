"use strict"

module.exports = Havel => {
	const child_process = require('child_process');
	const duplexify = require('duplexify');

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
				'-'+(opt.level ?? 6),
				'--threads='+(opt.threads ?? 1),
			],
			'xzCompress'
		)
	}

	function decompressXZ(opt = {}) {
		return spawn(
			'xz',
			[
				'--decompress',
				'--threads='+(opt.threads ?? 1),
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
