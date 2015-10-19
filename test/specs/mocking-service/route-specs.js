'use strict';

let sinon = require('sinon');
require('sinon-as-promised');
let Immutable = require('immutable');
let Router = require('koa-router');

let test = require('../../tape-as-promised');

let raml = require('../../../raml');
let routesService = require('../../../mocking-service/routes');
let BOOKS_API = Immutable.fromJS(require('../portal/fixtures/books.json'))
  .toJS();

test('Mocking service route registration', function*(t) {
  let router = sinon.createStubInstance(Router);
  sinon.stub(raml, 'loadApi').resolves(BOOKS_API);
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


