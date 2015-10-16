'use strict';

let path = require('path');
let Router = require('koa-router');
let raml = require('../raml');

module.exports = function*(ramlPath) {
  let router = new Router();

  let apiSpec = yield raml.loadApi(ramlPath);
  setupRoutes(router, apiSpec);

  return router;
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
    router.call(methodObj.method, routePath, routeHandlerFactory(methodObj));
  });
}

// Generates Koa route handlers for different http methods
function routeHandlerFactory(methodObject) {
  let httpMethod = methodObject.method.toLowerCase();

  if (['get', 'delete'].indexOf(httpMethod) >= 0) {

  } else if (['post', 'put'].indexOf(httpMethod) >= 0) {

  }

  return function*() {
    this.body = methodObject.responses['200'].example;
  };
}
