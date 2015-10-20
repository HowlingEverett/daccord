'use strict';

let http = require('http');

let sinon = require('sinon');
require('sinon-as-promised');
let Immutable = require('immutable');
let Router = require('koa-router');
let koa = require('koa');
let supertest = require('supertest');

let test = require('../../tape-as-promised');

let raml = require('../../../raml');
let routesService = require('../../../mocking-service/routes');
let BOOKS_API = Immutable.fromJS(require('../portal/fixtures/books-parsed.json'));

test('Mocking service route registration', function*(t) {
  let router = sinon.createStubInstance(Router);
  sinon.stub(raml, 'loadApi').resolves(BOOKS_API.toJS());
  router = yield routesService(null, router);

  t.equal(router.get.callCount, 2, 'Two GET routes attached');
  t.equal(router.put.callCount, 1, 'One PUT route attached');
  t.notOk(router.post.called, 'No POST routes attached');
  t.notOk(router.delete.called, 'No DELETE routes attached');

  t.ok(router.get.calledWith('/books'),
    'GET route set up for collection /books');
  t.ok(router.get.calledWith('/books/:title'),
    '{title} converted to :title parameter');
  t.ok(router.put.calledWith('/books/:title'),
    'PUT route set up on same resource as GET');

  raml.loadApi.restore();
});

let server, request;
test('Mocking service integration tests', function*() {
  sinon.stub(raml, 'loadApi').resolves(BOOKS_API.toJS());
  let app = koa();
  let router = yield routesService();
  app.use(router.routes());
  server = http.createServer(app.callback());
  request = supertest(server);
});

test('Mocking service returns example JSON response bodies', function(t) {
  let exampleListResponse = Immutable.fromJS
    (require('./fixtures/books-body.json')).toJS();
  request.get('/api/v1/books')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .expect(200, exampleListResponse, t.end);
});

test('End Mocking service integration tests', function(t) {
  server.close();
  raml.loadApi.restore();
  t.end();
});
