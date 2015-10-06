window.jQuery = window.$ = require('jquery');
require('../vendor/bootstrap-4.0.0-alpha/dist/js/umd/util');
require('../vendor/bootstrap-4.0.0-alpha/dist/js/umd/tab');

function initTabs() {
  $('.nav-item:first-child [role="tab"]').tab('show');
}

// DOM Ready listener
$(function() {
  initTabs();
});
