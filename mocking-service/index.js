'use strict';

// We're forking a new Node process in this module
let fork = require('child_process').fork;
let path = require('path');

let child;

/**
 * Spin up a mocking service instance to handle test requests and mocked
 * responses for the resources included in the provided parsed RAML spec.
 * @param {string} [ramlPath] Path to a RAML file. If not included, the child
 * process will try to load `api_definitions/api.raml`.
 * @returns {Promise} Returns a promise that will resolve to the .
 */
module.exports.enableMocking = function(ramlPath) {
  return new Promise(function(resolve, reject) {
    let childPath = path.resolve(__dirname, './mocking-app');
    let args = ramlPath ? [ramlPath] : [];
    args.unshift(process.env.PORT + 1);
    child = fork(childPath, args);
    child.on('message', function(message) {
      if (message.indexOf('MOCKINGLIVE:') >= 0) {
        let rootUrl = message.split(':')[1];
        return resolve(rootUrl);
      } else if (message.indexOf('MOCKINGERROR:') >= 0) {
        let errorMessage = message.split(':')[1];
        return reject(new Error(errorMessage));
      }
    });
  });
};

/**
 * Shut down the mocking service and restore standard standard pass-through
 * functionality.
 */
module.exports.disableMocking = function() {
  child.disconnect();
  child = null;
};
