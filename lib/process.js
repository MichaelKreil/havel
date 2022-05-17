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
	
	async function* spawnGenerator(cmd, args, iterator) {
		iterator = await iterator;
		let name = `spawn (${cmd}${args ? ' '+args.join(' ') : ''}):`;
		const process = child_process.spawn(cmd, args, { highWaterMark:1024*1024 });

		process.on('exit',  (c,s) => { if (c || s) console.error(name, 'exit', c, s) });
		process.on('close', (c,s) => { if (c || s) console.error(name, 'close', c, s) });
		process.on('error', e => { throw e });
		process.stderr.on('data', data => console.error(name, 'stderr', data.toString()))

		let writable = wrapWritableStream();
		for await (let chunk of process.stdout) {
			yield chunk;
		}
		await writable;
		return

		async function wrapWritableStream() {
			let resolve = false;
			process.stdin.on('error', err => {
				if (err.code === 'EPIPE') return doContinue();
			})
			process.stdin.on('drain', doContinue);
			for await (let chunk of iterator) {
				if (process.stdin.write(chunk)) continue;
				await new Promise(res => resolve = res);
			}
			process.stdin.end();

			function doContinue() {
				if (!resolve) return
				let func = resolve;
				resolve = false;
				func();
			}
		}
	}
}


