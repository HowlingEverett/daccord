'use strict';

var fs = require('fs');
var path = require('path');

var sinon = require('sinon');
require('sinon-as-promised');
let Immutable = require('immutable');
var test = require('../../tape-as-promised');
var ramlParser = require('raml-parser');
var raml = require('../../../raml');

const DEFINITIONS_SCHEMA = require('./fixtures/definitions.json');
const TEST_RAML = Immutable.fromJS(require('../portal/fixtures/books.json'))
  .toJS();

test('RAML Parser wrapper', function(t) {
  sinon.stub(fs, 'readFile').yieldsAsync(null,
    JSON.stringify(DEFINITIONS_SCHEMA));
  sinon.stub(ramlParser, 'loadFile').resolves(TEST_RAML);

  t.end();
});

test('Attempts to load ./api_defintions/api.raml unless specified',
  function*(t) {
    yield raml.loadApi();
    t.ok(ramlParser.loadFile
      .calledWith(path.resolve('./api_definitions/api.raml')),
      'Tried to load ./api_definitions/api.raml');
    ramlParser.loadFile.reset();
  });

test('Attempts to load passed path relative to cwd if specified', function*(t) {
  let ramlPath = './api_definitions/whatever.raml';
  yield raml.loadApi('./api_definitions/whatever.raml');
  t.ok(ramlParser.loadFile.calledWith(path.resolve(ramlPath)),
    'Tried to load API definition that\'s passed in');
  ramlParser.loadFile.reset();
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

test('Throws exception if RAML parser cannot find the file', function(t) {
  t.plan(1);
  raml.loadApi('./api_definitions/non-existent.raml')
    .then(function() {
      t.fail();
    })
    .catch(function(err) {
      t.ok(err.toString().match(/ENOENT: no such file or directory/),
        'Error thrown containing ENOENT method');
    });
});

test('Throw exception if RAML parser cannot parse the file', function(t) {
  t.plan(1);
  raml.loadApi('./test/specs/raml/fixtures/bad-raml.raml')
    .then(function() {
      t.fail();
    })
    .catch(function(err) {
      t.equal(err.name, 'YAMLError');
    });
});
