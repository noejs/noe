// const createNoe = require('./noe_ff');
// const createNoe = require('./noe_ff');

// function noe(options = {}) {
//     const noeApp = createNoe(options);

//     try {
//         noeApp.services(options.services);
//         noeApp.uses(options.components);
//         console.log('kernel components list: ', noeApp.list());
//     } catch (err) {
//         noeApp.Logger.error(err.message);
//         process.exit(1);
//     }

//     return noeApp;
// }

// module.exports = noe;

const { Noe, di } = require('./noe');
const Component = require('./component');

function noe(options = {}) {
    const noeApp = new Noe(options);
    return noeApp;
}

module.exports = { noe, di, Component };
