"use strict"

module.exports = havel => {
	const { StringDecoder } = require('string_decoder');
	
	return Object.assign(havel, {
		join,
		split,
		toBase64,
		toHex,
	})

	function toBase64() {
		const decoder = new StringDecoder('base64');
		return havel.Transform({
			transform: (chunk, enc, cb) => cb(null, decoder.write(chunk)),
			flush: (cb) => cb(null, decoder.end()),
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
			opt.transform = (chunk, enc, cb) => cb(null, decoder.write(chunk).toUpperCase());
			opt.flush = (cb) => cb(null, decoder.end().toUpperCase());
		} else {
			opt.transform = (chunk, enc, cb) => cb(null, decoder.write(chunk));
			opt.flush = (cb) => cb(null, decoder.end());
		}

		return havel.Transform(opt)
	}

	function join(joiner = '\n') {
		let start = true;

		function transform(chunk, enc, cb) {
			if (start) {
				start = false;
				cb(null, Buffer.from(chunk, 'utf8'));
			} else {
				cb(null, Buffer.from(joiner + chunk, 'utf8'));
			}
		}

		return havel.Transform({
			transform: function(chunk, enc, cb) {
				if (start) {
					start = false;
					cb(null, Buffer.from(chunk, 'utf8'));
				} else {
					cb(null, Buffer.from(joiner + chunk, 'utf8'));
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

		return havel.Transform({
			transform: function(chunk, enc, cb) {
				last += decoder.write(chunk)
				let list = last.split(matcher);
				last = list.pop();
				for (let i = 0; i < list.length; i++) {
					if (list[i]) this.push(list[i]);
				}
				cb()
			},
			flush: function(cb) {
				last += decoder.end()
				if (last) this.push(last);
				cb()
			},
			inputType: 'stream',
			outputType: 'string',
			name: `split (${matcher.toString()})`
		})
	}
}
