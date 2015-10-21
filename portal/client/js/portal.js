'use strict';

window.jQuery = window.$ = require('jquery');

// Bootstrap Plugins
require('../vendor/bootstrap-4.0.0-alpha/dist/js/umd/util');
require('../vendor/bootstrap-4.0.0-alpha/dist/js/umd/tab');

// Prism.js Syntax Hightlighting
require('prismjs');

// Mocking service UI
require('./mocking-ui');

function initTabs() {
  $('.nav-item:first-child [role="tab"]').tab('show');
}

// DOM Ready listener
$(function() {
  initTabs();
});
