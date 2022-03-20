"use strict"

module.exports = Havel => {
	const { StringDecoder } = require('string_decoder');

	return Object.assign(Havel, {
		join,
		split,
		toBase64,
		toHex,
	})

	function toBase64() {
		const decoder = new StringDecoder('base64');
		return Havel.Transform({
			transform: chunk => decoder.write(chunk),
			flush: () => decoder.end(),
			inputType: 'stream',
			outputType: 'string',
			name: 'toBase64',
		})
	}

	function toHex(uppercase = false) {
		const decoder = new StringDecoder('hex');
		const opt = {
			inputType: 'stream',
			outputType: 'string',
			name: 'toHex',
		}

		if (uppercase) {
			opt.transform = chunk => decoder.write(chunk).toUpperCase();
			opt.flush = () => decoder.end().toUpperCase();
		} else {
			opt.transform = chunk => decoder.write(chunk);
			opt.flush = () => decoder.end();
		}

		return Havel.Transform(opt)
	}

	function join(joiner = '\n') {
		let start = true;

		return Havel.Transform({
			transform: chunk => {
				if (start) {
					start = false;
					return Buffer.from(chunk, 'utf8');
				} else {
					return Buffer.from(joiner + chunk, 'utf8');
				}
			},
			inputType: 'string',
			outputType: 'stream',
			name: `join (${JSON.stringify(joiner)})`
		})
	}

	function split(matcher = /\n/) {
		const decoder = new StringDecoder('utf8');

		let last = '';

		return Havel.Transform({
			transform: (chunk, write) => {
				last += decoder.write(chunk)
				let list = last.split(matcher);
				last = list.pop();
				for (let i = 0; i < list.length; i++) {
					if (list[i]) write(list[i]);
				}
			},
			flush: () => {
				last += decoder.end()
				if (last) return last;
			},
			inputType: 'stream',
			outputType: 'string',
			name: `split (${matcher.toString()})`
		})
	}
}
