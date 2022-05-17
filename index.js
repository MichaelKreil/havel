'use strict'

const Havel = require('./lib/havel.js');

require('./lib/basics.js'  )(Havel);
require('./lib/buffer.js'  )(Havel);
require('./lib/compress.js')(Havel);
require('./lib/keyValue.js')(Havel);
require('./lib/object.js'  )(Havel);
require('./lib/process.js' )(Havel);
require('./lib/stream.js'  )(Havel);
require('./lib/string.js'  )(Havel);

module.exports = Havel
