"use strict"

module.exports = Havel => {
	const fs = require('fs');
	const readline = require('readline');

	Havel.registerNode('readFile', (filename, opt) => {
		if (!opt) opt = {};
		if (!fs.existsSync(filename)) throw Error(`file does not exist "${filename}"`)
		const stream = fs.createReadStream(filename);

		if (opt.showProgress) {
			let lastUpdate = 0;
			let size = fs.statSync(filename).size;
			let pos = 0;
			let times = [{pos,time:Date.now()}];
			stream.on('data', c => {
				pos += c.length;

				let now = Date.now();

				if (now - lastUpdate < 1000) return;

				if (now - times[0].start > 30000) {
					times.push({pos,time:now});
					if (times.length > 10) times.slice(-10);
				}

				lastUpdate = now;
				let posDiff  = pos - times[0].pos;
				let timeDiff = now - times[0].time;
				let progress = pos / size;
				let timeLeft = timeDiff * (size - pos) / posDiff / 1000;
				if (timeLeft > 86400) {
					timeLeft = (timeLeft / 86400).toFixed(1) + ' days'
				} else if (timeLeft > 3600) {
					timeLeft = (timeLeft / 3600).toFixed(1) + ' hours'
				} else if (timeLeft > 60) {
					timeLeft = (timeLeft / 60).toFixed(1) + ' minutes'
				} else {
					timeLeft = (timeLeft).toFixed(1) + ' seconds'
				}

				let eta = (new Date(timeDiff*(size-pos)/posDiff + now)).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
				let speed = (posDiff/1048576)/(timeDiff/1000);

				readline.clearLine(process.stderr, 0, () => {
					process.stderr.write('\r' + [
						(100 * progress).toFixed(2) + '%',
						speed.toFixed(2) + 'MB/s',
						timeLeft,
						eta,
					].join(' - '))
				})
			});

			stream.on('close', () => process.stderr.write('\n'));
		}

		return Havel.wrapStream(null, stream, { inputType:'nothing', outputType:'stream', name:`readFile (${filename})` });
	})

	Havel.registerNode('writeFile', (filename) => {
		const stream = fs.createWriteStream(filename);
		return Havel.wrapStream(stream, null, { inputType:'stream', outputType:'nothing', name:`writeFile (${filename})` });
	})
}
