/*global describe, it, beforeEach, afterEach*/
'use strict';


var assert = require('assert');
var sinon  = require('sinon');
var hubjs  = require('hubjs');
var licy   = require('..');

var stopFilter = function (next) {
  /*jslint unparam: true*/
  return;
};

var returnFilter = function (next, callback) {
  /*jslint unparam: true*/
  callback();
};


describe('destroy', function () {

  it('emits "destroy" event on instance', function () {
    var s = sinon.spy();
    var t = licy.create();
    t.on('destroy', s);

    t.destroy();

    sinon.assert.calledOnce(s);
  });

  it('removes all listeners', function () {
    var s = sinon.spy();
    var t = licy.create();
    t.on('test', s);

    t.destroy();
    t.emit('test');

    sinon.assert.notCalled(s);
  });

  it('removes all filters', function () {
    var s = sinon.spy();
    var t = licy.create();
    t.addFilter('test', s);

    t.destroy();
    t.emit('test');

    sinon.assert.notCalled(s);
  });

  it('does not remove all listeners or filters if event is stopped',
    function () {
      var t = licy.create();
      var s = sinon.spy();
      t.addFilter('test', s);
      t.on('test', s);
      t.addFilter('destroy', returnFilter);

      t.destroy();
      t.emit('test');

      sinon.assert.calledTwice(s);
    });

  it('calls destroy on children', function () {
    var t = licy.create();
    var c1 = t.create();
    var c2 = t.create();
    sinon.spy(c1, 'destroy');
    sinon.spy(c2, 'destroy');

    t.destroy();

    sinon.assert.calledOnce(c1.destroy);
    sinon.assert.calledOnce(c2.destroy);
  });

  it('does not call destroy on children if event is stopped', function () {
    var t = licy.create();
    var c = t.create();
    sinon.spy(c, 'destroy');

    t.addFilter('destroy', returnFilter);
    t.destroy();

    sinon.assert.notCalled(c.destroy);
  });

  it('does not destroy children twice', function () {
    var t = licy.create();
    var c = t.create();
    sinon.spy(c, 'destroy');

    t.destroy();
    t.destroy();

    sinon.assert.calledOnce(c.destroy);
  });

  it('does not attempt to destroy already destroyed child', function () {
    var t = licy.create();
    var c = t.create();
    sinon.spy(c, 'destroy');

    c.destroy();
    t.destroy();

    sinon.assert.calledOnce(c.destroy);
  });

  it('invokes given callback', function () {
    var t = licy.create();
    var s = sinon.spy();

    t.destroy(s);

    sinon.assert.calledOnce(s);
  });

  it('does not invoke given callback if destroy is pending', function () {
    var t = licy.create();
    var s = sinon.spy();

    t.addFilter('destroy', stopFilter);
    t.destroy(s);

    sinon.assert.notCalled(s);
  });

  it('waits for all children to be destroyed before removing listeners',
    function () {
      var t = licy.create();
      var c = t.create();
      var s = sinon.spy();
      t.on('test', s);
      var onDestroy = sinon.spy(function (cb) {
        /*jslint unparam: true*/
        return;
      });
      c.on('destroy', onDestroy);

      t.destroy();
      t.emit('test');

      sinon.assert.calledOnce(s);
      s.reset();

      onDestroy.yield();
      t.emit('test');

      sinon.assert.notCalled(s);
    });

  it('waits for all children to be destroyed before invoking custom destroy',
    function () {
      var s = sinon.spy();
      var t = licy.create({ destroy : s });
      var c = t.create();
      var onDestroy = sinon.spy(function (cb) {
        /*jslint unparam: true*/
        return;
      });
      c.on('destroy', onDestroy);

      t.destroy();

      sinon.assert.notCalled(s);

      onDestroy.yield();

      sinon.assert.calledOnce(s);
    });

  it('invokes custom destroy', function () {
    var s = sinon.spy();
    var t = licy.create({ destroy : s });

    t.destroy();

    sinon.assert.calledOnce(s);
  });

  it('invokes custom destroy on correct `this`', function () {
    var s = sinon.spy();
    var t = licy.create({ destroy : s });

    t.destroy();

    sinon.assert.calledOnce(s);
    sinon.assert.calledOn(s, t);
  });

  it('waits for custom destroy callback', function () {
    var callback;
    var s = sinon.spy();
    var t = licy.create({
      destroy: function (cb) {
        callback = cb;
      }
    });

    t.destroy(s);

    sinon.assert.notCalled(s);

    callback();

    sinon.assert.calledOnce(s);
  });

  it('returns from destroy immediately if custom destroy has no callback',
    function () {
      var s = sinon.spy();
      var t = licy.create({
        destroy: function () { return; }
      });

      t.destroy(s);

      sinon.assert.calledOnce(s);
    });

});
