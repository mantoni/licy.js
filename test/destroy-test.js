/*
 * licy.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
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

  it('emits "instance.destroy" event on prototype', function () {
    var s = sinon.spy();
    var T = licy.define();
    T.prototype.on('instance.destroy', s);

    var t = new T();
    t.destroy();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t);
  });

  it('does not emit "instance.destroy" if destroy listener does not return',
    function () {
      var s = sinon.spy();
      var T = licy.define();
      T.prototype.on('instance.destroy', s);

      var t = new T();
      t.on('destroy', function (callback) {
        /*jslint unparam: true*/
        return;
      });
      t.destroy();

      sinon.assert.notCalled(s);
    });

  it('does not return from destroy until "instance.destroy" returned',
    function () {
      var T = licy.define();
      var c;
      T.prototype.on('instance.destroy', function (instance, err, callback) {
        /*jslint unparam: true*/
        c = callback;
      });
      var t = new T();
      var s = sinon.spy();

      t.destroy(s);

      sinon.assert.notCalled(s);

      c();

      sinon.assert.calledOnce(s);
    });

  it('passes destroy error to callback', function () {
    var T = licy.define();
    var t = new T();
    var s = sinon.spy();
    var err = new Error();
    t.on('destroy', function () {
      throw err;
    });

    t.destroy(s);

    sinon.assert.calledWith(s, err);
  });

  it('passes destroy error to "instance.destroy"', function () {
    var T = licy.define();
    var s = sinon.spy();
    T.prototype.on('instance.destroy', s);
    var t = new T();
    var err = new Error();
    t.on('destroy', function () {
      throw err;
    });

    t.destroy(function () { return; });

    sinon.assert.calledWith(s, t, err);
  });

  it('passes error from "instance.destroy" back to destroy callback',
    function () {
      var T = licy.define();
      var t = new T();
      var s = sinon.spy();
      var err = new Error();
      t.on('destroy', s);
      T.prototype.on('instance.destroy', function () {
        throw err;
      });

      t.destroy(s);

      sinon.assert.calledWith(s, err);
    });

  it('does not remove listeners until "instance.destroy" returned',
    function () {
      var T = licy.define();
      var c;
      T.prototype.on('instance.destroy', function (instance, err, callback) {
        /*jslint unparam: true*/
        c = callback;
      });
      var t = new T();
      var s = sinon.spy();
      t.on('test', s);

      t.destroy();
      t.emit('test');

      sinon.assert.calledOnce(s);
      s.reset();

      c();
      t.emit('test', function () {
        // Ignore error
        return;
      });

      sinon.assert.notCalled(s);
    });

  it('removes all listeners', function () {
    var s = sinon.spy();
    var t = licy.create();
    t.on('test', s);

    t.destroy();
    t.emit('test', function () { return; }); // pass callback to ignore error

    sinon.assert.notCalled(s);
  });

  it('removes all filters', function () {
    var s = sinon.spy();
    var t = licy.create();
    t.addFilter('test', s);

    t.destroy();
    t.emit('test', function () { return; }); // pass callback to ignore error

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

  it('calls destroy on created children', function () {
    var c1 = licy.create();
    var c2 = c1.create();
    sinon.spy(c1, 'destroy');
    sinon.spy(c2, 'destroy');

    licy.destroy();

    sinon.assert.calledOnce(c1.destroy);
    sinon.assert.calledOnce(c2.destroy);
  });

  it('calls destroy on newed up children', function () {
    var T1 = licy.define();
    var c1 = new T1();
    var T2 = c1.define();
    var c2 = new T2();

    sinon.spy(c1, 'destroy');
    sinon.spy(c2, 'destroy');

    licy.destroy();

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
    t.destroy(function () { return; }); // pass callback to ignore error

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
      t.emit('test', function () { return; });

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

  it('throws when using the API after destruction', function () {
    var s = sinon.spy();
    var t = licy.create({
      foo: s
    });

    t.destroy();

    assert.throws(function () {
      t.foo();
    }, /Error: \[licy Type\] destroyed/);
    sinon.assert.notCalled(s);
  });

});
