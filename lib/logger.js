/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
/*!
 * noe.js
 * Copyright(c) 2020 Luca Stasio <joshuagame@gmail.com>
 * MIT Licensed
 */

/**
 * @module lib/logger
 */

const winston = require('winston');
const Moment = require('moment');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
const config = require('config');
const path = require('path');
const redactSecrets = require('redact-secrets')('[REDACTED]');

const env = process.env.NODE_ENV || 'development';

const logPath = config.log.path || './logs';
const logFile = config.log.file || (env === 'test' ? 'test.log' : 'app.log');
const logLevel = config.log.level || (env === 'development' ? 'debug' : 'info');

function formatMessage(msg) {
    return env === 'development' ? msg : stripAnsi(msg);
}

function createLogger() {
    const transports = [];
    if (env === 'development') {
        transports.push(new winston.transports.Console({
            name: 'console.log'
        }));
    } else {
        transports.push(new winston.transports.File({ filename: `${path.join(logPath, logFile)}` }));
    }

    return winston.createLogger({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(
                (i) => formatMessage(
                    `${chalk.gray(new Moment(i.timestamp).format('DD-MM-YYYY HH:mm:ss.SSSS'))} [${i.level}]: ${i.message}`
                )
            )
        ),
        transports,
        level: logLevel
    });
}

function redact(obj) {
    return redactSecrets.map(obj);
}

module.exports = {
    createLogger,
    redact
};
