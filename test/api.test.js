'use strict';
/* API con almacenamiento en archivo (en memoria). */
const { createStore } = require('../server/store');
const { runSuite } = require('./suite');

runSuite(() => createStore(null));
