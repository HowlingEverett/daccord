'use strict';

let http = require('http');

let sinon = require('sinon');
require('sinon-as-promised');

let test = require('../../tape-as-promised');

let mockingService = require('../../../mocking-service');
let MockingApp = require('../../../mocking-service/mocking-app').MockingApp;
let routesService = require('../../../mocking-service/routes');

test('Mocking service application specs', function(t) {
  sinon.stub(http, 'createServer').returns({
    listen: sinon.stub().yieldsAsync(null),
    close: sinon.stub()
  });
  sinon.stub(routesService, 'buildRoutes').resolves({
    routes: function*(next) {yield next;}
  });
  process.send = sinon.stub();
  t.end();
});

test('Mocking app runs HTTP server on specified port', function(t) {
  let app = new MockingApp(3001);
  app.app = {
    use: sinon.stub(),
    callback: function() {}
  };
  app.on('mockingserver', function(err) {
    if (err) {
      throw err;
    }
    t.ok(http.createServer.called, 'HTTP Server created');
    t.ok(app.server.listen.calledWith(3001),
      'Server set to listen on specified port');
    t.end();
  });
  app.run();
});

test('Mocking app executes dynamic routes service', function(t) {
  let app = new MockingApp(3001);
  app.app = {
    use: sinon.stub(),
    callback: function() {}
  };
  app.on('mockingserver', function(err) {
    if (err) {
      throw err;
    }
    t.ok(routesService.buildRoutes.called, 'Routes service executed.');
    t.end();
  });
  app.run();
});

test('Mocking app shuts down HTTP server on shutdown method', function(t) {
  let app = new MockingApp(3001);
  app.app = {
    use: sinon.stub(),
    callback: function() {}
  };
  app.on('mockingserver', function(err) {
    if (err) {
      throw err;
    }
    app.shutdown();
    t.ok(app.server.close.called, 'HTTP Server close method called');
    t.end();
  });
  app.run();
});

test('End mocking service application specs', function(t) {
  http.createServer.restore();
  routesService.buildRoutes.restore();
  t.end();
});
