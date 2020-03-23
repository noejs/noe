/*!
 * noe.js
 * Copyright(c) 2020 Luca Stasio <joshuagame@gmail.com>
 * MIT Licensed
 */

/**
 * @module lib/index
 */
const Noe = require('./noe');
const Component = require('./component');

function noe(options = {}) {
    const noeApp = new Noe(options);
    return noeApp;
}

// module.exports = { noe, di, Component };
module.exports = { noe, Component };
