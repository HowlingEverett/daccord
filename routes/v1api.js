'use strict';

var api = require('../api/v1');

/**
 * Resource endpoints for API Version 1
 * @param {object} router Instance of koa-router
 */
module.exports.routes = function(router) {
  router.get('/contract/:id?', api.contract);
};

module.exports.middleware = function(router) {

};