'use strict';
/**
 * Runs a child-process instance of koa that runs in an isolated HTTP server
 * for hosting mocked routes populated by the examples included in your RAML
 * file.
 * @module
 */

let util = require('util');
let http = require('http');
let EventEmitter = require('events');

let koa = require('koa');
let debug = require('debug')('mocking-app');

let routes = require('./routes');

let MESSAGE_TYPES = {
  live: 'MOCKINGLIVE',
  error: 'MOCKINGERROR'
};

class MockingApp extends EventEmitter {
  constructor(port, ramlPath) {
    super();
    this.app = koa();
    this.port = port;
    this.ramlPath = ramlPath;
  }

  /**
   *
   * @returns {Promise.<object>}
   */
  run() {
    routes.buildRoutes(this.ramlPath).then(router => {
      this.app.use(router.routes());
      this.server = http.createServer(this.app.callback());
      this.server.listen(this.port, err => {
        let message;
        if (err) {
          message = util.format('%s:%s', MESSAGE_TYPES.error, err);
          this.emit('mockingserver', err);
        } else {
          message = util.format('%s:%s', MESSAGE_TYPES.live, '');
          this.emit('mockingserver');
        }
        debug(message, 'port:', this.port);
        if (process.send) {
          process.send(message);
        }
      });
    });
  }

  /**
   *
   */
  shutdown() {
    debug('Shutting down mocking server on port', this.port, '...');
    this.server.on('close', () => {
      debug('Mocking server closed');
    });
    this.server.close();
  }
}

function init() {
  let args = process.argv.slice(2);
  let port = args[0];
  let ramlPath = args.length >= 2 ? args[1] : undefined;

  let mockingApp = new MockingApp(port, ramlPath);
  process.on('disconnect', () => {
    mockingApp.shutdown();
  });
  mockingApp.run();
}

// Exports
module.exports.MESSAGE_TYPES = MESSAGE_TYPES;
module.exports.MockingApp = MockingApp;

// Child-process initialisation
if (!module.parent) {
  init();
}
