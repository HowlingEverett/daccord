'use strict';

let querystring = require('querystring');

let slug = require('slug');
let capitalize = require('capitalize');
let _ = require('underscore');

let raml = require('../raml');

/**
 * Loads the API specification for the given RAML or api_definitions/api.raml and processes
 * the data into a format ready for rendering into the Portal List page
 * @param {string} [apiPath] Relative path to a RAML file. If this isn't set, the service
 * will attempt to laod the default RAML: ./api_definitions/api.raml
 */
module.exports.listTabs = function*(apiPath) {
  let apiSpec = yield raml.loadApi(apiPath);
  apiSpec.resources = processToTabs(apiSpec.resources, apiSpec);
  return apiSpec;
};

// Recursively processes resources to generate tab objects
function processToTabs(resources, apiSpec, pathComponents) {
  return resources.map(function(resource) {
    var pathSegments = resource.relativeUriPathSegments;
    if (pathComponents) {
      pathSegments = pathComponents.concat(pathSegments);
    }
    resource.tabs = processTabs(resource, pathSegments, apiSpec);
    if (resource.resources) {
      processToTabs(resource.resources, apiSpec, pathSegments);
    }
    return resource;
  });
}

function processTabs(resource, pathComponents, apiSpec) {
  var tabs = [];
  resource.methods.forEach(function(method) {
    tabs.push({
      id: slug(`${resource.displayName} ${method.method}`, {mode: 'rfc3986'}),
      label: method.method.toUpperCase(),
      method: augmentMethod(method, pathComponents, apiSpec)
    });
  });
  return tabs;
}

function augmentMethod(method, pathComponents, apiSpec) {
  var baseUri = apiSpec.baseUri.replace('{version}', apiSpec.version);
  var path = pathComponents.join('/');
  var query = buildQuery(method.queryParameters);

  method.exampleUri = `${baseUri}/${path}`;
  if (query) {
    method.exampleUri += '?' + query;
  }

  return method;
}

function buildQuery(queryParams) {
  return _.map(queryParams, function(param, key) {
    return `${key}=${encodeURIComponent(param.example)}`;
  }).join('&');
}
