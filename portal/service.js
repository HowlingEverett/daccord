let slug = require('slug');
let capitalize = require('capitalize');

let raml = require('../raml');

/**
 * Loads the API specification for the given RAML or api_definitions/api.raml and processes
 * the data into a format ready for rendering into the Portal List page
 * @param {string} [apiPath] Relative path to a RAML file. If this isn't set, the service
 * will attempt to laod the default RAML: ./api_definitions/api.raml
 */
module.exports.listTabs = function*(apiPath) {
  let apiSpec = yield raml.loadApi(apiPath);
  apiSpec.resources = processToTabs(apiSpec.resources);
  return apiSpec;
};

// Recursively processes resources to generate tab objects
function processToTabs(resources) {
  return resources.map(function(resource) {
    resource.tabs = processTabs(resource);
    if (resource.resources) {
      processToTabs(resource.resources);
    }
    return resource;
  });
}

function processTabs(resource) {
  var tabs = [];
  resource.methods.forEach(function(method) {
    tabs.push({
      id: slug(`${resource.displayName} ${method.method}`, {mode: 'rfc3986'}),
      label: method.method.toUpperCase(),
      method: method
    });
  });
  return tabs;
}
