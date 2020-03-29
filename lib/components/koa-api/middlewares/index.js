const errorHandler = require('./error-handler.middleware');
const favicon = require('./favicon.middleware');

function createMiddleware(middleware) {
    return function create() {
        return middleware;
    };
}

module.exports = {
    errorHandler,
    favicon,
    createMiddleware
};
