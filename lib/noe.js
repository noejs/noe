const createLogger = require('./logger');
const { injector } = require('./container');

/**
 * Create the Noe.js application instance with the properly
 * loaded configuration and eventually passed options.
 * @private
 */
function createNoe(options = {}) {
    /**
     * Noe.js appLogger initiallized mixing app configuration and eventual options.
     */
    const appLogger = createLogger(options.log);

    /**
     * component names registry, to be used during configuration, start and stop of the components.
     * @private
     */
    const components = [];

    return {

        /**
         * Resgister a service with the container.
         * A service can be injected in any other di injectable which requires it.
         * @param {string} name - the name to register the service in the container with
         * @param  {[string]} deps - the list of dependencies for this service
         * @param {function} ctor - the constructor of the component to register
         * @returns {object} the app instance for components chiaining
         * @public
         */
        service(name, deps, ctor) {
            if (arguments.length === 0 && arguments.length > 3) {
                throw new Error('malformed parameters for minimjs#use: expecting at least a string, am array and a function');
            }

            let cdeps = arguments.length === 3 ? deps : [];
            let cname = name;
            let cfun = ctor;

            if (arguments.length === 2) {
                if ((typeof arguments[0] !== 'string' || arguments[0].constructor !== 'array') && typeof arguments[1] !== 'function') {
                    throw new TypeError('malformed parameterd for minimjs#use: with two params call we are expecting a string and a function');
                }
                if (typeof arguments[0] === 'string') {
                    [cname, cfun] = arguments;
                } else {
                    [cdeps, cfun] = arguments;
                    cname = cfun.name;
                }
            } else if (arguments.length === 1) {
                if (typeof arguments[0] !== 'function') {
                    throw new TypeError('malformed parameterd for minimjs#use: single param must be a function');
                }
                cfun = name;
                cname = cfun.name;
            }

            appLogger.info(`registering service: ${cname} ${cdeps && cdeps.length > 0 ? 'with dependencies: ' : ''}${cdeps}`);
            injector.service(cname, cfun, ...cdeps);
            return this;
        },

        /**
         * Register a list of service definitions with the container.
         * @param  {...object} services - the list of service definitions to register
         * @public
         */
        services(...services) {
            services.forEach((s) => this.service(s));
        },

        start() {
            appLogger.info('noe.js started');
            appLogger.debug('noe.js started');
        },

        /**
         * Returns the application logger.
         * @returns {object} - the application logger
         * @public
         */
        get Logger() {
            return appLogger;
        }
    };
}

module.exports = createNoe;
