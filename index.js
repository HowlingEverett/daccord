var koa = require('koa');
var mount = require('koa-mount');
var Router = require('koa-router');

// Routes files
var portal = require('./routes/portal');
var v1api = require('./routes/v1api');

var app = koa();

// Configure API portal application
var portalApp = koa();
var router = new Router();
portal.routes(router);
portalApp.use(router.routes());

// Configure v1 of the JSON API
var v1apiApp = koa();
var apiRouter = new Router();
v1api.routes(apiRouter);
v1apiApp.use(router.routes());

// Mount the applications
app.use(mount('/', portalApp));
app.use(mount('/api/v1', v1apiApp));

// Run the server
app.listen(3000, function() {
    console.log('D\'accord portal running on port 3000');
});
