var raml = require('../raml');

/**
 *
 * @returns {string}
 */
module.exports.apiList = function*() {
  try {
    var apiSpec = yield raml.loadApi();
    yield this.render('api-list', apiSpec);
  } catch(e) {
    if (e.name === 'YAMLError') {
      return this.body = 'Could not load RAML at specified path';
    }
    throw e;
  }
};
