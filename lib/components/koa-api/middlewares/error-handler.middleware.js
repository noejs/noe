const moment = require('moment');

module.exports = (logger) => async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // switch on error statuses to better configure returning error messsage

        if (err.status === 403 || err.status === 401) {
            err.type = 'Security error';
        } else if (err.message && err.message.isJoi) {
            err.status = 400;
            // eslint-disable-next-line no-console
            console.log('err.message: ', JSON.stringify(err.message.details));
            err.errors = err.message.details.map((d) => ({
                type: d.type,
                // eslint-disable-next-line no-useless-escape
                message: d.message.replace(/\"/g, "'")
            }));
            err.type = err.message.name;
            err.message = 'Error during validation';
        } else if (err.name && err.name.startsWith('Sequelize')) {
            err.errors = err.errors.map((e) => ({
                type: e.type,
                message: e.message
            }));
            err.type = err.name;
            err.message = 'Error during database operation';
            if (err.type.includes('UniqueConstraint')) {
                err.status = 409;
            }
        }

        ctx.status = err.status || 500;
        ctx.body = {
            status: 'error',
            type: err.type || 'Internal server error',
            message: err.message || 'Internal server error',
            errors: err.errors,
            // eslint-disable-next-line new-cap
            timestamp: new moment().format(),
            request: ctx.request
        };

        logger.error(`${JSON.stringify(ctx.body, null, (process.env.NODE_ENV === 'development' ? 2 : 0))}`);
    }
};
