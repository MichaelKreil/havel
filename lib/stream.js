'use strict'

module.exports = Havel => {
	const fs = require('fs');

	/**
	 * @augments Pipeline
	 */

	/**
	 * @function readFile
	 * @desc reads a file as stream
	 * @param {String} filename
	 * @param {Boolean} showProgress=false
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('readFile', function readFile(filename, showProgress = false) {
		if (!fs.existsSync(filename)) throw Error(`file does not exist "${filename}"`)
		const stream = fs.createReadStream(filename);
		stream.on('error', e => {
			throw e;
		})

		if (showProgress) {
			let lastUpdate = 0;
			let size = fs.statSync(filename).size;
			let pos = 0;
			let times = [{ pos, time: Date.now() }];
			stream.on('data', c => {
				pos += c.length;

				let now = Date.now();

				if (now - lastUpdate < 1000) return;

				if (now - times[0].start > 30000) {
					times.push({ pos, time: now });
					if (times.length > 10) times.slice(-10);
				}

				lastUpdate = now;
				let posDiff = pos - times[0].pos;
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

				let eta = (new Date(timeDiff * (size - pos) / posDiff + now)).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
				let speed = (posDiff / 1048576) / (timeDiff / 1000);

				process.stderr.write('\u001b[2K\r' + [
					(100 * progress).toFixed(2) + '%',
					speed.toFixed(2) + 'MB/s',
					timeLeft,
					eta,
				].join(' - '))
			});

			stream.on('end', () => {
				if (showProgress) process.stderr.write('\n')
			});
		}
		return stream;
	})

	/**
	 * @function writeFile
	 * @desc write a stream as file
	 * @param {String} filename
	 * @memberof Pipeline
	 * @instance
	 */
	Havel.registerNodeFactoryStream('writeFile', function writeFile(filename) {
		const stream = fs.createWriteStream(filename);
		stream.on('error', e => { throw e; })
		return stream;
	})
}
