'use strict';

var test = require('tape');
var Test = require('tape/lib/test');
var co = require('co');
var sinon = require('sinon');
require('sinon-as-promised');

var raml = require('../../../raml');
var portalService = require('../../../portal/service');

// Override the run prototype to handle generator or promise callbacks
Test.prototype.run = function() {
  if (this._skip) {
    return this.end();
  }
  this.emit('prerun');
  try {
    var callback = this._cb && this._cb(this);
    var isGenerator = checkGenerator(callback);
    var isPromise = checkPromise(callback);
    var self = this;
    if (isGenerator) {
      callback = co(callback);
      isPromise = true;
    }
    if (isPromise) {
      callback.then(function() {
        self.end();
      }, function(err) {
        self.error(err);
        self.end();
      });
    }
  } catch(err) {
    this.error(err);
    this.end();
    return;
  }
  this.emit('run');
};

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

test('End API List Transformation Tests', function(t) {
  raml.loadApi.restore();
  t.end();
});

function stubRamlParser(ramlJSON) {
  return sinon.stub(raml, 'loadApi').resolves(ramlJSON);
}

function checkPromise(p) {
  return p && p.then && typeof p.then === 'function';
}

function checkGenerator(g) {
  return g && typeof g.next === 'function' && typeof g.throw === 'function';
}
