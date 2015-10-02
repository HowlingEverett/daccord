var path = require('path');
var ramlParser = require('raml-parser');

module.exports.contract = function*() {
  var contractId = (this.params.id || 'api') + '.raml';
  var contractPath = path.resolve(process.cwd(), 'api_definitions', contractId);
  this.body = yield ramlParser.loadFile(contractPath);
};
