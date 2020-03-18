const createNoe = require('./noe');

function Noe(options = {}) {
    const noe = createNoe(options);
    return noe;
}

module.exports = Noe;
