'use strict';

var path = require('path');

var _ = require('underscore');
var ramlParser = require('raml-parser');

/**
 * Request handler for rendering the entire API contract as JSON. By default
 * this is sourced from a RAML file located at ./api_definitions/api.raml.
 * However, you can pass a specific API file by name
 * @param {string} [this.params.id] name of the RAML file you want to load.
 * This file must exist inside the api_definitions directory, and contain the
 * .raml extension.
 */
module.exports.contract = function*() {
  this.body = yield resolveRamlPath(this.query.contractName);
};

/**
 * Get the schema for a specific resource, including descriptions of all
 */
module.exports.schema = function*() {
  var apiSpec = yield resolveRamlPath(this.query.contractName);
  this.body = buildResourceDescription(this.params.resourceName, apiSpec);
};

function *resolveRamlPath(ramlId) {
  if (!ramlId) {
    ramlId = 'api';
  }
  var ramlPath = path.resolve(process.cwd(), 'api_definitions',
    ramlId + '.raml');
  return yield ramlParser.loadFile(ramlPath);
}

function buildResourceDescription(resourceName, apiSpec) {
  let resource = _.find(apiSpec.resources, function(resource) {
    // Find the resource which includes resourceName in its relative path
    // segements.
    return resource.relativeUriPathSegments.indexOf(resourceName) !== -1;
  });
  let availableMethods = findAvailableMethods(resource);
  let schemas = getBodySchemas(availableMethods, resource);
  return {
    availableMethods: availableMethods,
    bodies: schemas
  };
}

function findAvailableMethods(resource) {
  let availableMethods = _.map(resource.methods, function(methodObj) {
    return methodObj.method.toUppercase();
  });
  if (resource.resources) {
    resource.resources.forEach(function(subResource) {
      availableMethods = availableMethods
        .concat(findAvailableMethods(subResource));
    });
  }
  return availableMethods;
}

function getBodySchemas(availableMethods, resource) {
  let method;
  if (availableMethods.indexOf('POST') >= 0) {
    method = _.find(resource.methods, function(methodObj) {
      return methodObj.method === 'post';
    });
  } else if (availableMethods.indexOf('PUT') >= 0) {
    resource.resources.forEach(function(subResource) {
      subResource.methods.forEach(function(methodObj) {
        if (methodObj.method === 'put') {
          method = methodObj;
        }
      });
    });
  }
  if (!method) {
    return [];
  }
  return _.map(method.body, function(contentType, key) {
    return _.extend({contentType: key}, contentType);
  });
}
