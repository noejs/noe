/* eslint-disable prefer-arrow-callback */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
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

async function createKoaApp(config) {
    const { logger, di } = config;

    return new Promise((resolve, reject) => {
        try {
            const koaApp = new Koa();

            // TODO: configure the middlewares registration
            koaApp
                .use(requestId())
                .use(favicon)
                .use(errorHandler)
                .use(helmet())
                .use(compress())
                .use(cors())
                .use(bodyParser());

            const controllersDir = path.join(process.cwd(), config.controllersDir);
            const routerPrefix = config.pathPrefix || '/';
            logger.debug(`initializing routing [prefix: ${routerPrefix}]`);
            const router = new Router({ prefix: routerPrefix });
            logger.debug(`API loading controllers from: ${controllersDir}`);
            fs.readdirSync(controllersDir)
                .filter((file) => file.indexOf('.') !== 0 && file.endsWith('.controller.js'))
                .forEach((file) => {
                    logger.info(`loading api route from controller: ${file}`);
                    // loads the Controller proto
                    const proto = require(`${path.join(controllersDir, file)}`);
                    // register the controller constructor with the Dependency Injection container
                    di.service(proto.controller.name, proto.controller, ...proto.deps);
                    logger.debug(`registered ${proto.controller.name}`);
                    // resolve controller instance to get routes
                    const controller = di.container[`${proto.controller.name}`];
                    logger.debug(`routing configuration for ${JSON.stringify(controller)}`);
                    router.use(controller.routes(new Router({ prefix: controller.routePrefix })));
                });

            koaApp
                .use(router.routes())
                .use(router.allowedMethods());

            resolve(koaApp);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = createKoaApp;
