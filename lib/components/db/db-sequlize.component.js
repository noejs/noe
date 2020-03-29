/* eslint-disable no-async-promise-executor */
/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const is = require('is_js');
const assert = require('assert');
const { createLogger, redact } = require('../../logger');
const Component = require('../../component');

class DbSequlizeComponent extends Component {
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
        this.logger.debug(`Component ${this.name} configuration: ${JSON.stringify(redact(this.config))}`);
        return new Promise(async (resolve, reject) => {
            try {
                const connectionString = `mysql://${this.config.username}:${this.config.password}@localhost:${this.config.port}/${this.config.schema}`;
                this.sequelize = new Sequelize(connectionString, {
                    logging: process.env.NODE_ENV !== 'production' ? this.logger.debug.bind(this.logger) : null,
                    pool: this.config.pool
                });

                await this.sequelize.authenticate();
                this.logger.info('database connection estabilished');

                await this._defineModels();
                this.logger.info('all models loaded and registered into DI');

                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
    }

    onShutdown() {
        this.sequelize.connectionManager.close()
            .then(() => this.logger.info(`db connction for ${this.name} component has been closed`));
    }

    _defineModels() {
        return new Promise(async (resolve, reject) => {
            try {
                // import all models
                const modelDir = path.join(process.cwd(), this.config.modelDir);
                fs.readdirSync(modelDir).forEach((filename) => {
                    if (path.parse(filename).ext.toLowerCase() === '.js') {
                        if (fs.statSync(path.resolve(modelDir, filename)).isFile()) {
                            const model = this.sequelize.import(`${modelDir}/${filename}`);
                            this.logger.debug(`model ${model.name} imported`);
                            const modelDiName = this._diModelName(model.name);
                            // eslint-disable-next-line prefer-arrow-callback
                            this.container.service(`${modelDiName}`, function createModel() { return model; });
                            this.logger.debug(`model ${model.name} registered into DI container as ${modelDiName}`);
                        }
                    }
                });

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    _diModelName(name) {
        return `${name.replace(/^\w/, (c) => c.toUpperCase())}Repository`;
    }
}

module.exports = DbSequlizeComponent;
