var path = require('path');

var stripExtension = require('strip-extension');
var koaHandlebars = require('koa-handlebars');
var handlebars = require('handlebars');
var serve = require('koa-static');

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
  // Handlebars rendering
  router.use(koaHandlebars({
    handlebars: handlebars,
    defaultLayout: 'portal',
    root: path.resolve(__dirname, '../portal'),
    partialId: function(file) {
      return stripExtension(file);
    }
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
};
