/* eslint-disable max-len */
const createLogger = require('./logger');
const createContainer = require('./container');

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
     * Noe.js app IoC container.
     */
    const container = createContainer(appLogger);

    /**
     * component names registry, to be used during configuration, start and stop of the components.
     * @private
     */
    const components = [];

    function isComponent(obj) {
        return Object.getOwnPropertyDescriptor(obj, 'start')
            && Object.getOwnPropertyDescriptor(obj, 'shutdown');
    }

    function componentByName(name) {
        return container.resolver[`${name}`];
    }

    return {
        /**
         * Resgister a service or a component with the container.
         * A service can be injected in any other di injectable which requires it.
         * @param {string} name - the name to register the service or the component in the container with
         * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
         * @public
         */
        register(name, args) {
            let cname = name;
            let ctor;
            let cdeps = [];

            if (args === undefined) {
                if (typeof name === 'string') {
                    throw new TypeError('malformed parameters for noe#register: with one params call, '
                        + 'the first must be a function (factory-function, constructor-function or class) or array');
                }
                if (Array.isArray(name)) {
                    cdeps = name.slice(0, name.length - 1);
                    ctor = name[name.length - 1];
                    cname = ctor.name;
                } else {
                    ctor = name;
                    cname = ctor.name;
                }
            } else if (typeof args === 'function') {
                ctor = args;
            } else if (typeof args === 'object') {
                if (Array.isArray(args)) {
                    cdeps = args.slice(0, args.length - 1);
                    ctor = args[args.length - 1];
                } else {
                    ctor = args;
                    cdeps = [];
                }
            } else {
                throw new TypeError('malformed parameters for noe#register');
            }

            appLogger.info(`registering service: ${cname} ${cdeps && cdeps.length > 0 ? 'with dependencies: ' : ''}${cdeps}`);
            container.injector.service(cname, ctor, ...cdeps);

            if (isComponent(componentByName(cname))) {
                components.push(cname);
                appLogger.info(`component ${cname} name registered`);
            }
            return this;
        },

        resolve(name) {
            return container.resolver[`${name}`];
        },

        /**
         * Resgister a service with the container.
         * It is an alias for register().
         * A service can be injected in any other di injectable which requires it.
         * @param {string} name - the name to register the service or the component in the container with
         * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
         */
        service(name, args) {
            this.register(name, args);
            return this;
        },

        /**
         * Resgister a component with the container.
         * It is an alias for register().
         * A service can be injected in any other di injectable which requires it.
         * @param {string} name - the name to register the service or the component in the container with
         * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
         */
        use(name, args) {
            this.register(name, args);
            return this;
        },

        /**
         * Register a list of services definitions with the container.
         * @param  {...object} services - the list of service definitions to register
         * @public
         */
        services(svcs = []) {
            svcs.forEach((s) => {
                if (typeof s === 'object') {
                    if (Array.isArray(s)) {
                        this.register(s[0], s[1], s[2]);
                    } else {
                        const cdeps = s.deps === undefined ? s.ctor : s.deps.concat(s.ctor);
                        this.register(s.name, cdeps);
                    }
                } else if (typeof arguments[0] !== 'function') {
                    this.register(s);
                }
            });
            return this;
        },

        /**
         * Register a list of components definitions with the container.
         * @param  {...object} cmps - the list of component definitions to register
         * @public
         */
        uses(cmps = []) {
            cmps.forEach((s) => {
                if (typeof s === 'object') {
                    if (Array.isArray(s)) {
                        this.register(s[0], s[1], s[2]);
                    } else {
                        this.register(s.name, s.deps || [], s.ctor);
                    }
                } else if (typeof arguments[0] !== 'function') {
                    this.register(s);
                }
            });
            return this;
        },

        start() {
            appLogger.info('noe.js started');
            appLogger.debug('noe.js started');
            return Promise.resolve();
        },

        /**
         * Returns the application logger.
         * @returns {object} - the application logger
         * @public
         */
        get Logger() {
            return appLogger;
        },

        /**
         * Returns the application IoC container instance.
         * @returns {object} - the application Ioc instance
         * @public
         */
        get Container() {
            return container;
        }
    };
}

module.exports = createNoe;
