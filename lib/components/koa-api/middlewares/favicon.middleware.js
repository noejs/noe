module.exports = async (ctx, next) => {
    if (!ctx || ctx.path !== '/favicon.ico') {
        await next();
    } else if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
        ctx.status = ctx.method === 'OPTIONS' ? 200 : 405;
        ctx.set('Allow', 'GET, HEAD, OPTIONS');
    } else {
        ctx.set('Cache-Control', 'no-cache');
        ctx.status = 204;
        ctx.body = {};
    }
};
