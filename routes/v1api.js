'use strict';

var api = require('../api/v1');

/**
 * Resource endpoints for API Version 1
 * Mounted on root path /api/v1
 * @param {object} router Instance of koa-router
 */
module.exports.routes = function(router) {
  // Render contract or contract resources as JSON
  router.get('/contract$', api.contract);
  router.get('/contract/:resourceName', api.schema);

  // Enable or disable the mocking service
  router.put('/mocking', api.mocking);
};

module.exports.middleware = function(router) {

};
