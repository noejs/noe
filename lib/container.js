const Bottle = require('bottlejs');

/**
 * Dependency Injection container wrapper factory function.
 * Initialize and keeps the unique container instance.
 * @private
 */
function createContainer() {
    const di = new Bottle();
    // console.log('dependency injection container initialized');

    return {
        get injector() {
            return di;
        },

        get resolver() {
            return di.container;
        }
    };
}

module.exports = createContainer();
