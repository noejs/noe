/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
const Bottle = require('bottlejs');
const config = require('config');
const createLogger = require('./logger');

const di = new Bottle();

class Noe {
    constructor(options = {}) {
        this.options = options;
        this.logger = options.logger || createLogger();

        this.logger.info('app and IoC container initialized');
        this._init();
    }

    // eslint-disable-next-line class-methods-use-this
    get Container() {
        return di;
    }

    /**
     * Resgister a component with the container.
     * It is an alias for register().
     * A service can be injected in any other di injectable which requires it.
     * @param {string} name - the name to register the service or the component in the container with
     * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
     */
    use(name, args) {
        const componentName = this._register(name, args);
        this.components.push(componentName);
        this.logger.info(`${componentName} component registered`);
        return this;
    }

    /**
     * Register a list of components definitions with the container.
     * @param  {...object} cmps - the list of component definitions to register
     * @public
     */
    uses(cmps = []) {
        this.logger.debug(`registering components ${JSON.stringify(cmps)}`);
        cmps.forEach((s) => {
            if (typeof s === 'object') {
                if (Array.isArray(s)) {
                    this.use(s[0], s[1], s[2]);
                } else {
                    const cdeps = s.deps === undefined ? s.ctor : s.deps.concat(s.ctor);
                    this.use(s.name, cdeps);
                }
            } else if (typeof arguments[0] !== 'function') {
                this.use(s);
            }
        });
        return this;
    }

    /**
     * Resgister a service with the container.
     * It is an alias for register().
     * A service can be injected in any other di injectable which requires it.
     * @param {string} name - the name to register the service or the component in the container with
     * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
     */
    service(name, args) {
        const serviceName = this._register(name, args);
        this.logger.info(`${serviceName} service registered`);
        return this;
    }

    /**
     * Register a list of services definitions with the container.
     * @param  {...object} services - the list of service definitions to register
     * @public
     */
    services(svcs = []) {
        this.logger.debug(`registering services ${JSON.stringify(svcs)}`);
        svcs.forEach((s) => {
            if (typeof s === 'object') {
                if (Array.isArray(s)) {
                    this.service(s[0], s[1], s[2]);
                } else {
                    const cdeps = s.deps === undefined ? s.ctor : s.deps.concat(s.ctor);
                    this.service(s.name, cdeps);
                }
            } else if (typeof arguments[0] !== 'function') {
                this.service(s);
            }
        });
        return this;
    }

    async start() {
        this.logger.info('starting the app');
        try {
            await this._configureComponents();
            await this._startComponents();
        } catch (err) {
            this.logger.error(err);
            this.logger.info('shutting down all started components');
            await this._shutdownComponents();
            process.exit(1);
        }
    }

    //
    // privates
    //

    /**
     * Initialize the Noe app instance, registering services and components passed in
     * with the options structure.
     * If any error occurr then it stops the Noe process.
     */
    _init() {
        this.components = [];
        try {
            this.services(this.options.services);
            this.uses(this.options.components);
        } catch (err) {
            this.logger.error(err.message);
            process.exit(1);
        }
    }

    /**
     * Resgister a service or a component with the container.
     * A service can be injected in any other di injectable which requires it.
     * @param {string} name - the name to register the service or the component in the container with
     * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
     * @return {string} the name of the service or component
     * @private
     */
    _register(name, args) {
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

        this.logger.debug(`registering ${cname} ${cdeps && cdeps.length > 0 ? 'with dependencies: ' : ''}${cdeps}`);
        di.service(cname, ctor, ...cdeps);

        return cname;
    }

    _comoponentByName(name) {
        return di.container[`${name}`];
    }

    _configByName(cname) {
        let compoentConfiguration = {};
        try {
            compoentConfiguration = config.get(cname);
        } catch (err) {
            this.logger.warn(`no configuration found for ${cname} component, this could be a problem!`);
        }
        return compoentConfiguration;
    }

    _configureComponents() {
        return new Promise((resolve, reject) => {
            this.logger.info('configuring components');
            // eslint-disable-next-line no-restricted-syntax
            for (const cname of this.components) {
                const component = this._comoponentByName(cname);
                if (component) {
                    try {
                        component.configure({ name: cname, config: this._configByName(cname) });
                    } catch (err) {
                        this.logger.error(`error configuring ${cname} component: ${err.message}`);
                        return reject(err);
                    }
                }
            }
            return resolve();
        });
    }

    _startComponents() {
        return new Promise((resolve, reject) => {
            this.logger.info('starting components');
            // eslint-disable-next-line no-restricted-syntax
            for (const cname of this.components) {
                const component = this._comoponentByName(cname);
                if (component && component.Started) {
                    try {
                        component.start();
                    } catch (err) {
                        this.logger.error(`error starting ${cname} component: ${err.message}`);
                        return reject(err);
                    }
                }
            }
            return resolve();
        });
    }

    _shutdownComponents() {
        return new Promise((resolve, reject) => {
            this.logger.info('shutting down components');
            // eslint-disable-next-line no-restricted-syntax
            for (const cname of this.components) {
                const component = this._comoponentByName(cname);
                if (component && (component.Configured || component.Started)) {
                    try {
                        component.shutdown();
                    } catch (err) {
                        this.logger.error(`error shutting down ${cname} component: ${err.message}`);
                        return reject(err);
                    }
                }
            }
            return resolve();
        });
    }
}

module.exports = { Noe, di };
