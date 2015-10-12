'use strict';

var path = require('path');
var url = require('url');

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
  let methodsArray = flattenMethods(resource,
    apiSpec.baseUri.replace('{version}', apiSpec.version));
  return {
    availableMethods: availableMethods,
    methods: methodsArray
  };
}

function findAvailableMethods(resource) {
  let availableMethods = _.map(resource.methods, function(methodObj) {
    return methodObj.method.toUpperCase();
  });
  if (resource.resources) {
    resource.resources.forEach(function(subResource) {
      availableMethods = availableMethods
        .concat(findAvailableMethods(subResource));
    });
  }
  return availableMethods;
}

function flattenMethods(resource, apiRoot, basePath) {
  let methods = [];
  basePath = basePath || '';
  let absoluteUri = apiRoot + basePath + resource.relativeUri;
  let relativeUri = basePath + resource.relativeUri;
  resource.methods.forEach(function(method) {
    if (method.body) {
      method.body = parseBodySchemas(method.body);
    }
    if (method.responses) {
      _.each(method.responses, function(response) {
        response.body = parseBodySchemas(response.body);
      });
    }
    method.absoluteUri = absoluteUri;
    method.relativeUri = relativeUri;
    // GET and No {} means this URI is for a collection
    method.collection = method.method === 'get' &&
      absoluteUri.indexOf('{') < 0;
    method.method = method.method.toUpperCase();
    methods.push(method);
  });
  if (resource.resources) {
    resource.resources.forEach(function(subResource) {
      methods = methods.concat(
        flattenMethods(subResource, apiRoot, relativeUri));
    });
  }
  return methods;
}

function parseBodySchemas(bodyObj) {
  _.each(bodyObj, function(body, contentType) {
    if (body.schema) {
      body.schema = JSON.parse(body.schema);
    }
    if (body.example) {
      body.example = JSON.parse(body.example);
    }
  });
  return bodyObj;
}
