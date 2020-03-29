/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/*!
 * noe.js
 * Copyright(c) 2020 Luca Stasio <joshuagame@gmail.com>
 * MIT Licensed
 */

/**
 * @module lib/noe
 */

/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
const config = require('config');
const is = require('is_js');
const { createLogger } = require('./logger');
const Container = require('./container');

/**
 * Class representing the main structure for a noe.js application.
 * Actually this class is not exported to the pubilc, but it is
 * instantiated in the lib/index module.
 */
class Noe {
    constructor(options = {}) {
        this.options = options;
        this.logger = options.logger || createLogger();
        this.di = new Container();
        this.service = this.service.bind(this);
        this.use = this.use.bind(this);
        this.logger.info('app and IoC container initialized');
        this._init();
    }

    // eslint-disable-next-line class-methods-use-this
    /**
     * The dependency injection kernel property.
     * @return {object} the dependency injection kernel
     * @public
     */
    get $di() {
        return this.di.$di;
    }

    /**
     * The dependency injection kernel Container property.
     * @return {object} the dependency injection kernel Container
     * @public
     */
    get $container() {
        return this.di.$di.container;
    }

    /**
     * The app logger initialized.
     * @return {object} the app logger
     * @public
     */
    get $logger() {
        return this.logger;
    }

    /**
     * Resgister a component with the container.
     * It is an alias for register().
     * A service can be injected in any other di injectable which requires it.
     * @param {string} name - the name to register the service or the component in the container with
     * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
     */
    use(name, args) {
        // const componentName = this._register(name, args);
        const componentName = this.di.register(name, args);
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
        this._registerMany(cmps, this.use);
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
        // const serviceName = this._register(name, args);
        const serviceName = this.di.register(name, args);
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
        this._registerMany(svcs, this.service);
        return this;
    }

    /**
     * Starts the application configuring and starting all of
     * the registered components.
     * @public
     */
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

        return this;
    }

    /**
     * Shuts down killing all of the started components.
     * @public
     */
    async shutdown() {
        this.logger.info('shutting down the app');
        try {
            await this._shutdownComponents();
            this.logger.info('bye!');
            process.exit(0);
        } catch (err) {
            this.logger.error(err);
            process.exit(1);
        }
    }

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

            process.on('SIGTERM', () => {
                this.logger.info('SIGTERM received...');
                this.shutdown();
            });

            process.on('SIGINT', () => {
                this.logger.info('SIGINT received...');
                this.shutdown();
            });
        } catch (err) {
            this.logger.error(err.message);
            process.exit(1);
        }
    }

    /**
     * Execute the input regFn on each element of the input "many" array.
     * This is used during many services or many components registrations.
     * @param {array} many - the array of the elements to register
     * @param {function} regFn - the registration function (one from this.service and this.use)
     * @private
     */
    _registerMany(many = [], regFn) {
        many.forEach((m) => {
            if (is.object(m)) {
                if (is.array(m)) {
                    regFn(m[0], m[1], m[2]);
                } else {
                    const cdeps = m.deps === undefined ? m.ctor : m.deps.concat(m.ctor);
                    regFn(m.name, cdeps);
                }
            } else if (typeof arguments[0] !== 'function') {
                regFn(m);
            }
        });
        return this;
    }

    /**
     * Get and return the configuration for the component.
     * @param {string} cname - the name of the component to get config for
     * @return {object} the configuration object for the component
     * @private
     */
    _configByName(cname) {
        let compoentConfiguration = {};
        try {
            compoentConfiguration = config.get(cname);
        } catch (err) {
            this.logger.warn(`no configuration found for ${cname} component, this could be a problem!`);
        }
        return compoentConfiguration;
    }

    /**
     * Await for all registered components configuration phase.
     * @private
     */
    async _configureComponents() {
        await Promise.all(this.components.map(async (cname) => {
            const component = this.di.resolve(cname);
            if (component) {
                await component.configure({
                    name: cname,
                    config: this._configByName(cname),
                    container: this.$di,
                    logger: this.logger
                });
            }
        }));
    }

    /**
     * Await for all registered components start phase.
     * @private
     */
    async _startComponents() {
        for (const cname of this.components) {
            const component = this.di.resolve(cname);
            if (component && component.Configured) {
                await component.start();
            }
        }
        // await Promise.all(this.components.map(async (cname) => {
        //     const component = this.di.resolve(cname);
        //     if (component && component.Configured) {
        //         await component.start();
        //     }
        // }));
    }

    /**
     * Await for all registered components shutdown phase.
     * @private
     */
    async _shutdownComponents() {
        await Promise.all(this.components.map(async (cname) => {
            const component = this.di.resolve(cname);
            if (component && component.Started) {
                await component.shutdown();
            }
        }));
    }
}

// module.exports = { Noe, di };
module.exports = Noe;
