'use strict';

var fs = require('fs');

var sinon = require('sinon');
require('sinon-as-promised');
var test = require('../../tape-as-promised');
var ramlParser = require('raml-parser');
var raml = require('../../../raml');

const DEFINITIONS_SCHEMA = require('./fixtures/definitions.json');
const TEST_RAML = require('../portal/fixtures/books.json');

test('RAML Parser wrapper', function(t) {
  sinon.stub(fs, 'readFile').yieldsAsync(null,
    JSON.stringify(DEFINITIONS_SCHEMA));
  sinon.stub(ramlParser, 'loadFile').resolves(TEST_RAML);

  t.end();
});

test('Includes imported sub-schemas in JSON body schemas', function*(t) {
  let apiSpec = yield raml.loadApi();
  let schema = apiSpec.resources[0].resources[0].methods[1]
    .body['application/json'].schema;
  t.notOk(schema.properties.paging.$ref, '$ref key gone');
  t.ok(schema.properties.paging.properties, 'sub-schema properties rendered');
  var propKeys = Object.keys(schema.properties.paging.properties);
  t.deepEqual(propKeys, [
    'requested_page',
    'records_per_page',
    'total_pages',
    'total_records',
    'record_from',
    'record_to'
  ], 'Sub-schema properties all set in-line under parent schema key');
});

test('Caches API spec in memory', function*(t) {
  fs.readFile.reset();
  yield raml.loadApi();
  t.notOk(fs.readFile.called, 'Should not have called readFile');
});

test('Returns a copy of the schema each time', function*(t) {
  let ramlA = yield raml.loadApi();
  let ramlB = yield raml.loadApi();
  t.notEqual(ramlA, ramlB,
    'Load the same API twice, get a different reference');
});

test('End Parser wrapper tests', function(t) {
  ramlParser.loadFile.restore();
  fs.readFile.restore();
  t.end();
});
