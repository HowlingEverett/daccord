'use strict';

let slug = require('slug');
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
  method.exampleUri = buildExampleUri(method, pathComponents, apiSpec, true);
  method.absoluteUri = buildExampleUri(method, pathComponents, apiSpec, false);
  if (method.body) {
    method.body = objectToArray(method.body, 'contentType');
  }
  method.responseTypes = Object.keys(method.responses['200'].body);
  method.responses = buildResponsesArray(method);
  if (method.queryParameters) {
    method.queryParameters = objectToArray(method.queryParameters, 'param');
  }
  return method;
}

function buildExampleUri(method, pathComponents, apiSpec, includeParams) {
  var baseUri = apiSpec.baseUri.replace('{version}', apiSpec.version);
  var path = pathComponents.join('/');
  var query = buildQuery(method.queryParameters);
  var exampleUri = `${baseUri}/${path}`;
  if (query && includeParams) {
    exampleUri += '?' + query;
  }
  return exampleUri;
}

function buildResponsesArray(method) {
  return Object.keys(method.responses).map(function(responseCode) {
    var response = method.responses[responseCode];
    response.code = responseCode;
    response.contentTypes = objectToArray(response.body, 'contentType');
    return response;
  });
}

function objectToArray(obj, keyName) {
  return Object.keys(obj).map(function(key) {
    var val = obj[key];
    val[keyName] = key;
    return val;
  });
}

function buildQuery(queryParams) {
  return _.map(queryParams, function(param, key) {
    return `${key}=${encodeURIComponent(param.example)}`;
  }).join('&');
}
