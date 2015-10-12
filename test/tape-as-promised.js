var co = require('co');
var Test = require('tape/lib/test');

function checkPromise(p) {
  return p && p.then && typeof p.then === 'function';
}

function checkGenerator(g) {
  return g && typeof g.next === 'function' && typeof g.throw === 'function';
}

// Override the run prototype to handle generator or promise callbacks
Test.prototype.run = function() {
  if (this._skip) {
    return this.end();
  }
  this.emit('prerun');
  try {
    var callback = this._cb && this._cb(this);
    var isGenerator = checkGenerator(callback);
    var isPromise = checkPromise(callback);
    var self = this;
    if (isGenerator) {
      callback = co(callback);
      isPromise = true;
    }
    if (isPromise) {
      callback.then(function() {
        self.end();
      }, function(err) {
        self.error(err);
        self.end();
      });
    }
  } catch(err) {
    this.error(err);
    return this.end();
  }
  this.emit('run');
};

module.exports = require('tape');
