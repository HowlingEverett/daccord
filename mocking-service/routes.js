'use strict';

let path = require('path');
let url = require('url');
let Router = require('koa-router');
let raml = require('../raml');
let debug = require('debug')('mocking-service/routes');

/**
 * Parses a RAML document and creates a fully-loaded mock API on a router,
 * ready to serve from a Koa application.
 * @param {string} [ramlPath] path to a RAML document, relative to process.cwd.
 * If you don't set this parameter, the router will attempt to load
 * ./api_definitions/api.raml
 * @param {object} [router] If set, routes will be attached to this router. If
 * you don't pass this argument a new koa-router instance will be created for
 * you.
 * @returns {Promise.<object>} instance of koa-router with mock routes for
 * the API defined in your raml document.
 */
module.exports.buildRoutes = function(ramlPath, router) {
  return raml.loadApi(ramlPath).then(function(apiSpec) {
    let prefix = apiSpec.baseUri.replace('{version}', apiSpec.version);
    prefix = url.parse(prefix).pathname;
    router = router || new Router();
    router.prefix(prefix);
    setupRoutes(router, apiSpec);
    return router;
  });
};


function setupRoutes(router, apiSpec, basePath) {
  if (!basePath) {
    basePath = '';
  }
  apiSpec.resources.forEach(function(resource) {
    setupResource(router, resource, basePath);
  });
}

function setupResource(router, resource, basePath) {
  let routePath = path.join(basePath, resource.relativeUri);
  setupMethods(router, resource.methods, routePath);
  if (resource.resources) {
    setupRoutes(router, resource, routePath);
  }
}

function setupMethods(router, methodObjects, routePath) {
  methodObjects.forEach(function(methodObj) {
    var paramPat = /{(\w+)}/;
    routePath = routePath.replace(paramPat, ':$1');
    debug('Registering', methodObj.method.toUpperCase(), routePath);
    router[methodObj.method](routePath, routeHandlerFactory(methodObj));
  });
}

// Generates Koa route handlers for different http methods
function routeHandlerFactory(methodObject) {
  return function*() {
    this.body = methodObject.responses['200'].body['application/json'].example;
  };
}
