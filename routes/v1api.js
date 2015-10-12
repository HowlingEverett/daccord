'use strict';

var api = require('../api/v1');

/**
 * Resource endpoints for API Version 1
 * @param {object} router Instance of koa-router
 */
module.exports.routes = function(router) {
  router.get('/contract', api.contract);
  router.get('/contract/:resourceName', api.schema);
};

module.exports.middleware = function(router) {

};