var path = require('path');

var stripExtension = require('strip-extension');
var koaHandlebars = require('koa-handlebars');
var handlebars = require('handlebars');
var portal = require('../portal');

/**
 * Routes for the D'accord documentation portal application.
 * @param router {object} An instance of koa-router for serving HTTP requests
 */
module.exports.routes = function(router) {
  router.get('/', portal.apiList);
};

/**
 * Common middleware for the D'accord documentation portal application
 * @param {object} router An instance of koa-router
 */
module.exports.middleware = function(router) {
  router.use(koaHandlebars({
    handlebars: handlebars,
    defaultLayout: 'portal',
    root: path.resolve(__dirname, '../portal'),
    partialId: function(file) {
      return stripExtension(file);
    }
  }));
};
