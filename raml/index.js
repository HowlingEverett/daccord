var path = require('path');
var ramlParser = require('raml-parser');

/**
 * Parses a RAML file at a given path and returns the AST object containing the API definitions,
 * if possible.
 * @param {string} [filename] fully resolved path to a RAML definition file. If none is specified,
 * this will default to PROJECT_ROOT/api_definitions/api.raml
 */
module.exports.parseApi = function(filename = '../api_definitions/api.raml') {
  filename = path.resolve(filename);
  return ramlParser.loadFile(filename);
};
