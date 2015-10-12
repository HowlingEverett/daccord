'use strict';

var sinon = require('sinon');
require('sinon-as-promised');

var test = require('../../tape-as-promised');
var raml = require('../../../raml');
var portalService = require('../../../portal/service');


// Fixture containing the output of raml-parser for a sample book API
var testApi = require('./fixtures/books.json');
var apiSpec;

test('Portal Service List API transformations', function*() {
  stubRamlParser(testApi);
  apiSpec = yield portalService.listTabs();
});

test('loads tab list onto parsed RAML', function(t) {
  var firstResource = apiSpec.resources[0];
  t.ok(firstResource.hasOwnProperty('tabs'), 'tabs property exists on resource');
  t.equal(firstResource.tabs.length, firstResource.methods.length, 'One tab for each method');
  var tab = firstResource.tabs[0];
  t.equal(tab.id, 'books-get', 'Tab ID is a slug built from resource displayName and method');
  t.equal(tab.label, 'GET', 'Tab label is method, upper-cased');
  t.ok(tab.hasOwnProperty('method'), 'Original method available on tab');
  t.end();
});

test('loads example URLs based on included examples', function(t) {
  var firstResource = apiSpec.resources[0];
  var method = firstResource.tabs[0].method;
  t.equal(method.exampleUri,
    'http://localhost:3000/api/v1/books?title=Return%20of%20the%20King&author=Tolkien',
    'Example URI built from baseUri, resource path, and example query params');
  var subResourceMethod = firstResource.resources[0].tabs[0].method;
  t.equal(subResourceMethod.exampleUri,
    'http://localhost:3000/api/v1/books/{title}',
    'Sub-path URIs include whole path');
  t.end();
});

test('Reprocesses responses into an iterable property', function(t) {
  var firstGet = apiSpec.resources[0].tabs[0].method;
  t.ok(firstGet.responses instanceof Array, 'Responses object converted to array');
  t.deepEqual(firstGet.responses.map(function(response) {
    return response.code;
  }), ['200', '400'], 'Responses an array of the response codes object');
  var okResponse = firstGet.responses[0];
  t.deepEqual(okResponse.contentTypes.map(function(contentType) {
    return contentType.contentType;
  }), ['application/json'], 'Response content types is an array of the content types');
  t.ok(okResponse.contentTypes[0].example, 'Content type object has example');
  t.ok(okResponse.contentTypes[0].schema, 'Content type object has schema');
  t.end();
});

test('Reprocesses request bodies into an iterable property', function(t) {

  t.end();
});

test('End API List Transformation Tests', function(t) {
  raml.loadApi.restore();
  t.end();
});

function stubRamlParser(ramlJSON) {
  return sinon.stub(raml, 'loadApi').resolves(ramlJSON);
}
