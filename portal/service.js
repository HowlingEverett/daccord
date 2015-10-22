'use strict';



let slug = require('slug');
let _ = require('underscore');
let markdownAst = require('markdown-to-ast');

let raml = require('../raml');
let mockingService = require('../mocking-service');

/**
 * Loads the API specification for the given RAML or api_definitions/api.raml
 * and processes the data into a format ready for rendering into the Portal List
 * page
 * @param {string} [apiPath] Relative path to a RAML file. If this isn't set,
 * the service will attempt to load the default RAML: ./api_definitions/api.raml
 */
module.exports.listTabs = function*(apiPath) {
  let apiSpec = yield raml.loadApi(apiPath);
  apiSpec.toc = buildToc(apiSpec);
  apiSpec.resources = processToTabs(apiSpec.resources, apiSpec);
  apiSpec.resourceIndex = buildResourceIndex(apiSpec.resources);
  return apiSpec;
};

/**
 * Check whether the mocking service is currently intercepting client requests.
 * Useful for setting initial state of relevant UI controls.
 * @returns {Boolean} Whether the mocking service is currently running
 */
module.exports.isMockingEnabled = function() {
  return mockingService.mockingEnabled();
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

function buildToc(apiSpec) {
  let tocHeadings = [];
  for (let doc of apiSpec.documentation) {
    let headings = extractHeadings(doc.content);
    tocHeadings = tocHeadings.concat(headings);
  }
  return tocHeadings;
}

function extractHeadings(markdown) {
  let ast = markdownAst.parse(markdown);
  let headings = [];

  for (let childNode of ast.children) {
    if (childNode.type !== 'Header') {
      continue;
    }

    let heading = {
      title: childNode.children[0].value,
      id: slug(childNode.children[0].value, {mode: 'rfc3986'}),
      depth: childNode.depth
    };
    headings.push(heading);
  }
  headings = nestHeadings(headings);

  return headings;
}

function nestHeadings(headings) {
  let partitions = partitionHeadings(headings);
  let nest = [];

  for (let partition of partitions) {
    nest.push(nestHeadingGroup(partition));
  }

  nest = nest.map(function(element) {
    return element.children;
  }).reduce(function(lastEntry, currentEntry) {
    return lastEntry.concat(currentEntry);
  });
  return nest;
}

function nestHeadingGroup(partition) {
  let group;
  let lastParent;
  do {
    let depthPartition = partition.shift();
    if (!lastParent) {
      group = depthPartition;
      lastParent = depthPartition;
      continue;
    }
    let parentKey = lastParent.children[lastParent.children.length - 1];
    parentKey.children = depthPartition.children;
    lastParent = depthPartition;
  } while (partition.length > 0);
  return group;
}

function partitionHeadings(headings) {
  let partitions = [];
  let lastDepth = 0;
  let currentPartition;
  for (let heading of headings) {
    if (heading.depth !== lastDepth) {
      if (currentPartition) {
        partitions.push(currentPartition);
      }
      currentPartition = {depth: heading.depth, children: [heading]};
    } else {
      if (!currentPartition) {
        currentPartition = [];
      }
      currentPartition.children.push(heading);
    }
    lastDepth = heading.depth;
  }
  partitions.push(currentPartition);
  return groupPartitions(partitions);
}

function groupPartitions(partitions) {
  let groups = [];
  let currentGroup;
  let currentDepth = 0;
  for (let partition of partitions) {
    if (!currentGroup) {
      currentGroup = [];
    }
    if (partition.depth > currentDepth) {
      currentGroup.push(partition);
    } else {
      groups.push(currentGroup);
      currentGroup = [partition];
    }
    currentDepth = partition.depth;
  }
  return groups;
}

function buildResourceIndex(resources) {
  let resourceIndex = [];
  for (let resource of resources) {
    let title = [resource.parentUri, resource.relativeUri].join('');
    resourceIndex.push({
      id: slug(title, {mode: 'rfc3986'}),
      title: title
    });
  }
  return resourceIndex;
}
