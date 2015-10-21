'use strict';

let $ = require('jquery');

function initMockingToggle() {
  $('[data-enable-mocking]').on('click', onMockingToggleClicked);
}

function onMockingToggleClicked(event) {
  event.preventDefault();
  let enable = this.getAttribute('data-enable-mocking') === 'true';
  $.ajax({
    url: this.href + '?enable=' + enable,
    method: 'PUT',
    data: {
      enable
    },
    dataType: 'json'
  }).done(res => {
    this.setAttribute('data-enable-mocking', (!res.active).toString());
    this.innerHTML = res.active ? 'Mocking enabled' : 'Mocking disabled';
    if (res.active) {
      this.classList.remove('btn-danger-outline');
      this.classList.add('btn-success-outline');
    } else {
      this.classList.remove('btn-success-outline');
      this.classList.add('btn-danger-outline');
    }
  }).fail(err => {
    console.warn('Mocking service could not be toggled:\n', err);
  });
}

$(document).ready(function() {
  initMockingToggle();
});
