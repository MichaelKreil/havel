'use strict'

module.exports = Havel => {
	const { StringDecoder } = require('string_decoder');

	Havel.registerNode('toBase64', () => Havel.wrapFunc({
		func: async function* toBase64(iterator) {
			const decoder = new StringDecoder('base64');
			for await (const chunk of iterator) {
				yield decoder.write(chunk);
			}
			yield decoder.end();
			this.finish();
		},
		inputType: 'stream',
		outputType: 'string',
	}))

	Havel.registerNode('toHex', (uppercase = false) => Havel.wrapFunc({
		func: async function* toHex(iterator) {
			const decoder = new StringDecoder('hex');
			if (uppercase) {
				for await (const chunk of iterator) yield decoder.write(chunk).toUpperCase();
				yield decoder.end().toUpperCase();
			} else {
				for await (const chunk of iterator) yield decoder.write(chunk);
				yield decoder.end();
			}
			this.finish();
		},
		inputType: 'stream',
		outputType: 'string',
		name: 'toHex'+(uppercase ? ' (UPPERCASE)' : '')
	}))

	Havel.registerNode('join', (joiner = '\n') => Havel.wrapFunc({
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
	}))

	Havel.registerNode('split', (matcher = /\n/) => Havel.wrapFunc({
		func: async function* split(iterator) {
			const decoder = new StringDecoder('utf8');
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
	}))
}
