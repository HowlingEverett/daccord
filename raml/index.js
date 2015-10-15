'use strict';

let path = require('path');
let fs = require('fs');
let ramlParser = require('raml-parser');
let traverse = require('traverse-async').traverse;

// Cache the RAML definitions so we don't have to do the parsing every time
// somebody hits the portal.
let ramlCache = {};

/**
 * Parses a RAML file at a given path and returns the AST object containing the
 * API definitions, if possible.
 * @param {string} [filename] fully resolved path to a RAML definition file.
 * If none is specified, this will default to
 * PROJECT_ROOT/api_definitions/api.raml
 * @returns {Promise} promise instance that will resolve to the api spec object
 */
module.exports.loadApi = function(filename) {
  filename = filename || './api_definitions/api.raml';
  filename = path.resolve(filename);
  return new Promise(function(resolve, reject) {
    if (ramlCache[filename]) {
      return resolve(JSON.parse(JSON.stringify(ramlCache[filename])));
    }
    let baseDir = path.dirname(filename);
    ramlParser.loadFile(filename).then(function(apiSpec) {
      processSchemas(apiSpec, baseDir, function(err, spec) {
        if (err) {
          return reject(err);
        }
        ramlCache[filename] = JSON.parse(JSON.stringify(spec));
        return resolve(spec);
      });
    }, function(err) {
      return reject(err);
    });
  });
};

function processSchemas(apiSpec, rootPath, done) {
  traverse(apiSpec, function(node, next) {
    if (this.key === 'schema') {
      let schema = JSON.parse(node);
      let self = this;
      self.parent[self.key] = schema;
      processSchemas(schema, rootPath, function(err, updatedSchema) {
        self.parent[self.key] = updatedSchema;
        return next();
      });
    } else if (this.key === '$ref') {
      let self = this;
      importSchemaRef(node, rootPath, function(err, subSchema) {
        if (err) {
          return next(err);
        }

        let pathKeys = self.path.slice(0, self.path.length - 1);
        let treeNode = apiSpec;
        let treeNodeKey;
        while (pathKeys.length > 1) {
          treeNodeKey = pathKeys.shift();
          treeNode = treeNode[treeNodeKey];
        }
        treeNodeKey = pathKeys.shift();
        treeNode[treeNodeKey] = subSchema;
        next();
      });
    } else {
      next();
    }
  }, function(updatedSchema) {
    return done(null, updatedSchema);
  });
}

function importSchemaRef(ref, rootPath, done) {
  let refs = ref.split('#');
  let refFile = path.resolve(rootPath, refs[0]);
  let keys = refs[1].substr(1).split('/'); // Split '/whatever/whatever/what
  fs.readFile(refFile, {encoding: 'utf8'}, function(err, subSchema) {
    if (err) {
      return done(err);
    }
    subSchema = JSON.parse(subSchema);
    for (let key of keys) {
      subSchema = subSchema[key];
    }
    return done(null, subSchema);
  });
}
