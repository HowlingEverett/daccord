'use strict';

var service = require('./service');

/**
 * Request handler for top-level API list.
 * @returns {string}
 */
module.exports.apiList = function*() {
  try {
    let apiList = yield service.listTabs(this.query.apipath);
    yield this.render('api-list', apiList);
  } catch(e) {
    if (e.name === 'YAMLError') {
      return this.body = 'Could not load RAML at specified path';
    }
    throw e;
  }
};
