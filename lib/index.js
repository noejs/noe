const createNoe = require('./noe');

function noe(options = {}) {
    const noeApp = createNoe(options);

    try {
        noeApp.services(options.services);
        noeApp.components(options.components);
    } catch (err) {
        noeApp.Logger.error(err.message);
        process.exit(1);
    }

    return noeApp;
}

module.exports = noe;
