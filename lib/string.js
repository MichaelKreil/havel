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
		return Havel({
			func: async function* toBase64(iterator) {
				for await (const chunk of iterator) {
					yield decoder.write(chunk);
				}
				yield decoder.end();
				this.finish();
			},
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
			opt.func = async function* toHex(iterator) {
				for await (const chunk of iterator) {
					yield decoder.write(chunk).toUpperCase();
				}
				yield decoder.end().toUpperCase();
				this.finish();
			}
		} else {
			opt.func = async function* toHex(iterator) {
				for await (const chunk of iterator) {
					yield decoder.write(chunk);
				}
				yield decoder.end();
				this.finish();
			}
		}

		return Havel(opt)
	}

	function join(joiner = '\n') {
		return Havel({
			func: async function* join(iterator) {
				let start = true;
				for await (const chunk of iterator) {
					if (start) {
						start = false;
						yield Buffer.from(chunk, 'utf8');
					} else {
						yield Buffer.from(joiner + chunk, 'utf8');
					}
				}
				this.finish();
			},
			inputType: 'string',
			outputType: 'stream',
			name: `join (${JSON.stringify(joiner)})`
		})
	}

	function split(matcher = /\n/) {
		const decoder = new StringDecoder('utf8');

		return Havel({
			func: async function* split(iterator) {
				let last = '';
				for await (const chunk of iterator) {
					last += decoder.write(chunk)
					if (last.length < 4096) continue;

					let list = last.split(matcher);
					last = list.pop();
					for (const line of list) yield line;
				}
				last += decoder.end()
				for (const line of last.split(matcher)) yield line;
				this.finish();
			},
			inputType: 'stream',
			outputType: 'string',
			name: `split (${matcher.toString()})`
		})
	}
}
