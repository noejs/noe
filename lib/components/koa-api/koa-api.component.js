/* eslint-disable no-async-promise-executor */
/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const http = require('http');
require('http-shutdown').extend();
const is = require('is_js');
const assert = require('assert');
const Koa = require('koa');
const requestId = require('koa-requestid');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const path = require('path');
const fs = require('fs');
const { errorHandler, favicon } = require('./middlewares');
const { createLogger } = require('../../logger');
const Component = require('../../component');

class KoaApiComponent extends Component {
    onConfigure({ name, config, container, logger }) {
        assert(!is.undefined(name), 'DbSequlizeComponent param "name" must be valued');
        assert(!is.undefined(config), 'DbSequlizeComponent param "config" must be valued');
        assert(!is.undefined(container), 'DbSequlizeComponent param "di" must be valued');

        this.name = name;
        this.config = config;
        this.container = container;
        this.logger = logger || createLogger();
    }

    onStart() {
        return new Promise((resolve, reject) => {
            this.logger.info('starting internal Koa app and http server');
            this._createKoaApp()
                .then((koaApp) => {
                    this.server = http.createServer(koaApp.callback()).listen(3000);
                    this.logger.info(`application started and listening on ${this.server.address().address}:${this.server.address().port}`);
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    _createKoaApp() {
        return new Promise((resolve, reject) => {
            try {
                const koaApp = new Koa();

                // TODO: configure the middlewares registration
                koaApp
                    .use(requestId())
                    .use(favicon)
                    .use(errorHandler(this.logger))
                    .use(helmet())
                    .use(compress())
                    .use(cors())
                    .use(bodyParser());

                const controllersDir = path.join(process.cwd(), this.config.controllersDir);
                const routerPrefix = this.config.pathPrefix || '/';
                this.logger.info(`initializing routing [prefix: ${routerPrefix}]`);

                const router = new Router({ prefix: routerPrefix });

                this.logger.debug(`API loading controllers from: ${controllersDir}`);
                fs.readdirSync(controllersDir)
                    .filter((file) => file.indexOf('.') !== 0 && file.endsWith('.controller.js'))
                    .forEach((file) => {
                        // loads the Controller proto
                        const proto = require(`${path.join(controllersDir, file)}`);

                        // register the controller constructor with the Dependency Injection container
                        this.container.service(proto.controller.name, proto.controller, ...proto.deps);

                        // resolve controller instance to get routes
                        const controller = this.container.container[`${proto.controller.name}`];
                        router.use(controller.routes(new Router({ prefix: controller.routePrefix })));
                    });

                koaApp
                    .use(router.routes())
                    .use(router.allowedMethods());

                router.stack.forEach((r) => {
                    this.logger.info(`registered route [${r.methods} ${r.path}] `);
                });

                resolve(koaApp);
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = KoaApiComponent;
