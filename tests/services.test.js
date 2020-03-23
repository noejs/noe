/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable class-methods-use-this */
process.env.NODE_CONFIG_DIR = `${process.cwd()}/tests/config/`;
const { expect } = require('chai');
const { describe, it } = require('mocha');
const { noe, di } = require('../lib');

const app = noe();

describe('services registration tests', () => {
    it('should register a Factory Function constructor', () => {
        function createService() {
            return {
                test() {
                    return 'test string from Factory Function created object';
                }
            };
        }

        app.service('FFService', createService);
        expect(di.container.FFService).to.be.an('object').that.has.property('test');
    });

    it('should register an ES5 prototype constructor', () => {
        function ProtoService() { }
        ProtoService.prototype.test = function () {
            return 'test string from ES5 prototype created object';
        };
        ProtoService.prototype.start = function () { };
        ProtoService.prototype.configure = function () { };

        app.service(ProtoService);
        expect(di.container.ProtoService).to.be.an('object').that.has.property('test');
    });

    it('should register an ES6 class constructor', () => {
        class ClassService {
            test() {
                return 'test string from ES6 class created object';
            }

            start() { }

            configure() { }
        }

        app.service('ClassService', ClassService);
        expect(di.container.ClassService).to.be.an('object').that.has.property('test');
    });

    it('should register a service defining Factory Function as service() parameter', () => {
        app.service('InlineService', function () {
            return {
                test() {
                    return 'test string from inline Factory Function service';
                }
            };
        });
        expect(di.container.InlineService).to.be.an('object').that.has.property('test');
    });
});

describe('services resolving tests', () => {
    it('should resolve the Factory Function created object and call method test() on it', () => {
        const ffService = di.container.FFService;
        expect(ffService.test()).to.be.equal('test string from Factory Function created object');
    });

    it('should resolve the ES5 prototype created object and call method test() on it', () => {
        const protoService = di.container.ProtoService;
        expect(protoService.test()).to.be.equal('test string from ES5 prototype created object');
    });

    it('should resolve the ES6 class created object and call method test() on it', () => {
        const classService = di.container.ClassService;
        expect(classService.test()).to.be.equal('test string from ES6 class created object');
    });
});

describe('services dependencies tests', () => {
    it('should register as service with its dependecies, and than resolve it and use dependencies', () => {
        function createServiceForDep() {
            return {
                test() {
                    return 'test string from Factory Function created object';
                }
            };
        }

        app.service('DepService', createServiceForDep);
        expect(di.container.DepService.test()).to.be.equal('test string from Factory Function created object');

        app.service('ServiceWithDeps', ['DepService', function (depService) {
            return {
                test() {
                    return `TEXT FROM DEP: ${depService.test()}`;
                }
            };
        }]);

        const serviceWithDeps = di.container.ServiceWithDeps;
        expect(serviceWithDeps.test()).to.be.equal('TEXT FROM DEP: test string from Factory Function created object');
    });

    it('should register as service with its dependecies, without specifying the name and than resolve it and use dependencies', () => {
        app.service(['DepService', function AutoNamedService(depService) {
            return {
                test() {
                    return `AUTONAMED: ${depService.test()}`;
                }
            };
        }]);

        const autoNamedService = di.container.AutoNamedService;
        expect(autoNamedService.test()).to.be.equal('AUTONAMED: test string from Factory Function created object');
    });
});
