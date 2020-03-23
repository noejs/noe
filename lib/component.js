/*!
 * noe.js
 * Copyright(c) 2020 Luca Stasio <joshuagame@gmail.com>
 * MIT Licensed
 */

/**
 * @module lib/component
 */

const is = require('is_js');
/* eslint-disable max-classes-per-file */
const componentFunctions = ['onStart', 'onShutdown', 'onConfigure'];

/**
 * Class representing the Component base abstract class to derive your component from.
 * Note that for Noe.js a component can be any object wiht the following
 * functions: 'onStart', 'onShutdown', 'onConfigure', even if it not derive from
 * the Component class.
 */
class Component {
    /**
     * The Component class constructor. Will check and block direct Component instantiation,
     * and will check and block instantiation for any derived class without the required functions.
     * @public
     */
    constructor() {
        if (new.target === Component) {
            throw new TypeError('Cannot instantiate a (abstract) Component directly');
        }
        componentFunctions.forEach((fname) => {
            if (is.undefined(fname)) {
                throw new TypeError(`${this.constructor.name} Must override the "${fname}" function`);
            }
        });

        this.state = { configured: false, started: false };
    }

    /**
     * Configuration options received during components startup phase.
     * options is in the form of
     * {
     *     name: <component-name>,
     *     config: <component-configs>,
     *     di: <di-container>
     * }
     * configure() will set name and di for the component and will delegate config to
     * the component's onConfig function.
     * @param {object} options - component configuration options
     * @public
     */
    async configure(options = {}) {
        await this.onConfigure(options);
        this.state.configured = true;
    }

    /**
     * Awaits the component's onStart function execution and then sets stat state to 'started'.
     * @public
     */
    async start() {
        await this.onStart();
        this.state.started = true;
    }

    /**
     * Will tear down the component calling component's onShutdown function.
     * @pubilc
     */
    async shutdown() {
        await this.onShutdown();
    }

    /**
     * Checks if an object is a Component. Use this function instead of a simple "instance of"
     * because whe can have components even not derived from the Component base class.
     * @param {object} obj - the obj to check
     * @return {boolean} true if obj is a Component, false otherwise
     * @public
     */
    static isComponent(obj) {
        return componentFunctions.forEach((fname) => obj[fname] === undefined);
    }

    get Configured() {
        return this.state.configured;
    }

    get Started() {
        return this.state.started;
    }
}

module.exports = Component;
