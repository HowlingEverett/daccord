'use strict';
/**
 * Runs a child-process instance of koa that hosts
 * @module
 */

let util = require('util');
let http = require('http');

let koa = require('koa');

let routes = require('./routes');

let MESSAGE_TYPES = {
  live: 'MOCKINGLIVE',
  error: 'MOCKINGERROR'
};
module.exports.MESSAGE_TYPES = MESSAGE_TYPES;

class MockingApp {
  constructor(port, ramlPath) {
    this.app = koa();
    this.port = port;
    this.ramlPath = ramlPath;
  }

  *run() {
    let router = yield routes(this.ramlPath);
    this.app.use(router.routes());
    this.server = http.createServer(this.app.callback())
      .listen(this.port, function(err) {
        if (err) {
          let errorMessage = util.format('%s:%s', MESSAGE_TYPES.error, err);
          return process.send(errorMessage);
        }
        let liveMessage = util.format('%s:%s', MESSAGE_TYPES.live, '');
        return process.send(liveMessage);
      });
  }

  shutdown() {
    this.server.close();
  }
}

// Child-process initialisation
let args = process.argv.slice(2);
let port = args[0];
let ramlPath = args.length >= 2 ? args[1] : undefined;

let mockingApp = new MockingApp(port, ramlPath);
process.on('disconnect', mockingApp.shutdown);
mockingApp.run();

