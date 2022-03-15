"use strict"

module.exports = havel => {
	const fs = require('fs');

	return Object.assign(havel, {
		readFile,
		writeFile,
	})

	function readFile(filename, opt) {
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
				let progress = pos/size;
				let eta = (new Date(timeDiff*(size-pos)/posDiff + now));
				eta = eta.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
				let speed = (posDiff/1048576)/(timeDiff/1000);

				process.stderr.write('\r'+[
					(100*progress).toFixed(2)+'%',
					speed.toFixed(2)+'MB/s',
					eta,
				].join(' - '));
			});

			stream.on('close', () => process.stderr.write('\n'));
		}

		return havel(stream, { inputType:'none', outputType:'stream', name:`readFile (${filename})` });
	}

	function writeFile(filename) {
		const stream = fs.createWriteStream(filename);
		return havel(stream, { inputType:'stream', outputType:'none', name:`writeFile (${filename})` });
	}
}
