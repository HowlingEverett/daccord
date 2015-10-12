'use strict';

var path = require('path');

var stripExtension = require('strip-extension');
var koaHandlebars = require('koa-handlebars');
var handlebars = require('handlebars');
var serve = require('koa-static');
var browserify = require('browserify-middleware');

// PostCSS Plugins
var postcss = require('koa-postcss');
var autoprefixer = require('autoprefixer');
var cssImport = require('postcss-import');
var cssVariables = require('postcss-custom-properties');
var cssSelectors = require('postcss-custom-selectors');
var cssNot = require('postcss-selector-not');
var cssMatches = require('postcss-selector-matches');
var cssInitial = require('postcss-initial');

// Handlers for the portal application
var portal = require('../portal');

// Helpers for the portal application
var portalHelpers = require('../portal/helpers');

/**
 * Routes for the D'accord documentation portal application.
 * @param router {object} An instance of koa-router for serving HTTP requests
 */
module.exports.routes = function(router) {
  router.get('/', portal.apiList);
};

/**
 * Common middleware for the D'accord documentation portal application
 * @param {object} app a koa app instance, for hooking middleware that might play with routes and
 * interfere with normal routing e.g. koa-static.
 * @param {object} router An instance of koa-router, for hooking middleware on the routes
 * themselves.
 */
module.exports.middleware = function(app, router) {
  let cache = process.env.NODE_ENV !== 'development';
  // Handlebars rendering
  router.use(koaHandlebars({
    handlebars: handlebars,
    defaultLayout: 'portal',
    root: path.resolve(__dirname, '../portal'),
    partialId: function(file) {
      return stripExtension(file).replace('\\', '/');
    },
    helpers: portalHelpers,
    cache: cache
  }));

  // Automatic CSSNext compilation
  app.use(postcss({
    src: './portal/client/css/portal.css',
    dest: './portal/public/css',
    plugins: [
      cssImport(),
      cssVariables(),
      cssSelectors(),
      cssInitial(),
      cssNot(),
      cssMatches(),
      autoprefixer()
    ]
  }));
  app.use(serve('portal/public'));

  // Automatic Browserify
  // Serve main client-side bundle for UI
  router.get('/js/bundle.js',
    wrapBrowserifyMiddleware(path.resolve(__dirname, '../portal/client/js/portal.js'), {
      transform: ['babelify']
    }));
};

// Private functions
function wrapBrowserifyMiddleware(path, opts) {
  var middleware = browserify(path, opts);

  return function*() {
    var req = this.req;
    var res = this.res;
    var end = res.end;

    this.body = yield function(next) {
      res.end = function(data) {
        res.end = end;
        next(null, data);
      };

      middleware(req, res, next);
    }
  }
}