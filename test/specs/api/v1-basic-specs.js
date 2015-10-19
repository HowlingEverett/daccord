'use strict';

let sinon = require('sinon');
require('sinon-as-promised');
const Immutable = require('immutable');
const koa = require('koa');
const http = require('http');
const supertest = require('supertest');
const Router = require('koa-router');
const raml = require('raml-parser');

let test = require('../../tape-as-promised');
let apiHandlers = require('../../../api/v1');

let booksFixture = Immutable.fromJS(require('../portal/fixtures/books.json'))
  .toJS();

let server;

test('/api/v1/contract/{resource}', function(t) {
  var request = setupRequest();
  request
    .get('/api/v1/contract/books')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      t.ok(res.body.hasOwnProperty('methods'),
        'includes available methods');
      t.notOk(res.err, 'Should have no error');
      let methodSummaries = res.body.methods &&
          res.body.methods.map(function(method) {
        return {
          method: method.method,
          absoluteUri: method.absoluteUri,
          relativeUri: method.relativeUri,
          collection: method.collection
        };
      });
      t.deepEqual(methodSummaries, [
        {
          method: 'GET',
          absoluteUri: 'http://localhost:3000/api/v1/books',
          relativeUri: '/books',
          collection: true
        },
        {
          method: 'GET',
          absoluteUri: 'http://localhost:3000/api/v1/books/{title}',
          relativeUri: '/books/{title}',
          collection: false
        },
        {
          method: 'PUT',
          absoluteUri: 'http://localhost:3000/api/v1/books/{title}',
          relativeUri: '/books/{title}',
          collection: false
        }
      ], 'returns the methods from resources and sub-resources');
      let detailGet = res.body.methods[1];
      t.deepEqual(Object.keys(detailGet.responses), ['200', '400'],
        'Includes existing responses');
      raml.loadFile.restore();
      t.end();
    });
});

test('/api/v1/contract/{resource} parses schema to object', function(t) {
  var request = setupRequest();
  request
    .get('/api/v1/contract/books')
    .set('Accept', 'application/json')
    .end(function(err, res) {
      let getDetailSchema = res.body.methods[1]
        .responses['200'].body['application/json'].schema;
      t.notEqual(typeof getDetailSchema, 'string', 'Schema is not a raw string');
      t.equal(getDetailSchema.$schema,
        'http://json-schema.org/draft-04/schema',
        'We\'re looking at a schema object');
      raml.loadFile.restore();
      t.end();
    });
});

test('End v1 API basic specs', function(t) {
  server.close();
  t.end();
});

function setupRequest() {
  sinon.stub(raml, 'loadFile')
    .resolves(JSON.parse(JSON.stringify(booksFixture)));

  let app = koa();
  let router = new Router();
  router.get('/api/v1/contract$', apiHandlers.contract);
  router.get('/api/v1/contract/:resourceName', apiHandlers.schema);
  app.use(router.routes());

  server = http.createServer(app.callback());
  return supertest(server);
}
