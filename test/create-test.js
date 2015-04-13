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


describe('create', function () {
  var ctor;

  beforeEach(function () {
    ctor = function () { return; };
  });

  afterEach(function () {
    licy.removeAll();
  });

  it('returns a new default instance', function () {
    var t;

    licy.create({
      constructor: function () {
        t = this.create();
      }
    });

    assert(t instanceof licy.Licy);
    assert(t instanceof hubjs.Hub);
  });

  it('returns a new custom instance from object', function () {
    var t;

    licy.create({
      constructor: function () {
        t = this.create({ constructor : ctor });
      }
    });

    assert(t instanceof ctor);
    assert(t instanceof licy.Licy);
    assert(t instanceof hubjs.Hub);
  });

  it('returns a new custom instance from type', function () {
    var t;
    var T = licy.define({
      constructor: ctor
    });

    licy.create({
      constructor: function () {
        t = this.create(T);
      }
    });

    assert(t instanceof T);
    assert(t instanceof licy.Licy);
    assert(t instanceof hubjs.Hub);
  });

  it('delays "destroy" event until constructor yields', function () {
    var callback;
    var s = sinon.spy();
    var t = licy.create({
      constructor: function (cb) {
        callback = cb;
      }
    });

    t.on('destroy', s);
    t.destroy();

    sinon.assert.notCalled(s);

    callback();

    sinon.assert.calledOnce(s);
  });

  it('delays custom function call until constructor yields', function () {
    var callback;
    var s = sinon.spy();
    var t = licy.create({
      constructor: function (cb) {
        callback = cb;
      },
      foo: s
    });

    t.foo();

    sinon.assert.notCalled(s);

    callback();

    sinon.assert.calledOnce(s);
  });

  it('emits "create" event on root object', function () {
    var s = sinon.spy();
    licy.on('create', s);
    var T = licy.define();

    var t = new T();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t, T);
  });

  it('emits "create" event on parent object', function () {
    var p = licy.create();
    var s = sinon.spy();
    p.on('create', s);
    var T = p.define();

    var t = new T();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t, T);
  });

  it('bubbles "create" event', function () {
    var p = licy.create();
    var s1 = sinon.spy();
    var s2 = sinon.spy();
    p.on('create', s1);
    licy.on('create', s2);
    var T = p.define();

    var t = new T();

    sinon.assert.calledOnce(s2);
    sinon.assert.calledWith(s2, t, T);
    sinon.assert.callOrder(s1, s2);
  });

  it('emits "instance.create" on type', function () {
    var s = sinon.spy();
    var T = licy.define();
    T.prototype.on('instance.create', s);

    var t = new T();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t, T);
  });

  it('does not emit "create" on root object if type blocks it', function () {
    var s = sinon.spy();
    licy.on('create', s);
    var T = licy.define();
    var n;
    T.prototype.addFilter('instance.create', function (next) {
      n = next;
    });

    var t = new T();

    sinon.assert.notCalled(s);

    n();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t, T);
  });

  it('does not return from "create" event on type until licy returns',
    function () {
      var s = sinon.spy();
      var t = licy.define();
      var c;
      t.prototype.addFilter('instance.create', function (next) {
        next(s);
      });
      licy.on('create', function (type, Type, callback) {
        /*jslint unparam: true*/
        c = callback;
      });
      t();

      sinon.assert.notCalled(s);

      c();

      sinon.assert.calledOnce(s);
    });

  function assertDeferredDelegate(T) {
    var c;
    T.prototype.on('instance.create', function (type, Type, callback) {
      assert.equal(T, Type);
      assert(type instanceof T);
      c = callback;
    });
    var s = sinon.spy();
    var t = new T();
    t.on('test', s);

    t.test();

    sinon.assert.notCalled(s);

    c();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s);
  }

  it('does not delegate event to instance until "create" returns',
    function () {
      var T = licy.define({
        test: function () { return; }
      });

      assertDeferredDelegate(T);
    });

  it('does not delegate event to instance until "create" returns (ctor)',
    function () {
      var T = licy.define({
        constructor: function () { return; },
        test: function () { return; }
      });

      assertDeferredDelegate(T);
    });

  it('does not delegate event to instance until "create" returns (async ctor)',
    function () {
      var T = licy.define({
        constructor: function (cb) { cb(); },
        test: function () { return; }
      });

      assertDeferredDelegate(T);
    });

  it('passes constructor arguments to constructor', function () {
    var s = sinon.spy(function (a, b, c) {
      /*jslint unparam: true*/
      return;
    });
    var T = licy.define({ constructor : s });

    var t = new T(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments if not called with new', function () {
    var s = sinon.spy(function (a, b, c) {
      /*jslint unparam: true*/
      return;
    });
    var type = licy.define({ constructor : s });

    var t = type(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments if arity is zero', function () {
    var s = sinon.spy();
    var type = licy.define({ constructor : s });

    var t = type(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments to async constructor', function () {
    var s = sinon.spy(function (a, b, c, callback) {
      /*jslint unparam: true*/
      return;
    });
    var T = licy.define({ constructor : s });

    var t = new T(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3], sinon.match.func);
    sinon.assert.calledOn(s, t);
  });

  it('passes callback as last argument to async constructor', function () {
    var s = sinon.spy(function (a, b, c, callback) {
      /*jslint unparam: true*/
      return;
    });
    var T = licy.define({ constructor : s });

    var t = new T(42);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, undefined, undefined,
        sinon.match.func);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments to ctor (return)', function () {
    var s = sinon.spy(function (a, b, c) {
      /*jslint unparam: true*/
      return {};
    });
    var T = licy.define(s);

    var t = new T(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
    sinon.assert.calledOn(s, t);
  });

  it('passes callback as last argument to async ctor (return)', function () {
    var s = sinon.spy(function (a, b, c, callback) {
      /*jslint unparam: true*/
      return {};
    });
    var T = licy.define(s);

    var t = new T(42);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, undefined, undefined,
        sinon.match.func);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments if arity is zero (return)', function () {
    var s = sinon.spy(function () { return {}; });
    var type = licy.define(s);

    var t = type(42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
    sinon.assert.calledOn(s, t);
  });

  it('passes constructor arguments through licy.create', function () {
    var s = sinon.spy(function () { return {}; });
    var T = licy.define(s);

    licy.create(T, 42, 'abc', [1, 2, 3]);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWithExactly(s, 42, 'abc', [1, 2, 3]);
  });

});
