/*!
 * noe.js
 * Copyright(c) 2020 Luca Stasio <joshuagame@gmail.com>
 * MIT Licensed
 */

/**
 * @module lib/container
 */

const Bottle = require('bottlejs');
const is = require('is_js');
const createLogger = require('./logger');

/**
 * Class representing the Dependency Injection kernel wrapper.
 * Object of this class can register and resolve instances into/from
 * the DI container.
 */
class Container {
    constructor(logger) {
        this.logger = logger || createLogger();
        this.di = new Bottle();
    }

    /**
     * Resgister a service or a component with the container.
     * A service can be injected in any other di injectable which requires it.
     * @param {string} name - the name to register the service or the component in the container with
     * @param {array} args -  an array of dependencies and the service or component constructor as last elememnt
     * @return {string} the name of the service or component
     * @public
     */
    register(name, args) {
        let cname = name;
        let ctor;
        let cdeps = [];

        if (is.undefined(args)) {
            console.log('***********');
            console.log(name);
            console.log('***********');
            if (is.string(name)) {
                throw new TypeError('malformed parameters for noe#register:'
                    + ' with one params call, commentsthe first must be a'
                    + ' function (factory-function, constructor-function'
                    + ' or class) or array');
            }
            if (is.array(name)) {
                cdeps = name.slice(0, name.length - 1);
                ctor = name[name.length - 1];
                cname = ctor.name;
            } else {
                ctor = name;
                cname = ctor.name;
            }
        } else if (is.function(args)) {
            ctor = args;
        } else if (is.object(args)) {
            if (is.array(args)) {
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
        this.di.service(cname, ctor, ...cdeps);

        return cname;
    }

    /**
     * Resolve an instance by its registered name.
     * @param {string} name - the name of the instance to resolve with
     */
    resolve(name) {
        return this.di.container[`${name}`];
    }

    /**
     * The dependency injection kernel property.
     * @return {Bottle} the Bottle dependency injection kernel
     */
    get $di() {
        return this.di;
    }
}

module.exports = Container;
