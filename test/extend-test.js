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


describe('extend', function () {
  var superConstructor;
  var method;
  var Super;

  beforeEach(function () {
    method = sinon.spy();
    superConstructor = sinon.spy(function Super() {
      return {
        test : method
      };
    });
    Super = licy.define(superConstructor);
  });

  afterEach(function () {
    licy.removeAll();
  });

  it('returns constructor that creates instance of given super', function () {
    var T = licy.extend(Super, {});

    var t = new T();

    assert(t instanceof Super);
  });

  it('returns constructor that creates instance of given super (return)',
    function () {
      var T = licy.extend(Super, function () { return {}; });

      var t = new T();

      assert(t instanceof Super);
    });

  it('returns constructor that creates instance of given super (ctor)',
    function () {
      var T = licy.extend(Super, {
        constructor : function () { return {}; }
      });

      var t = new T();

      assert(t instanceof Super);
    });

  it('calls super constructor if no own ctor defined', function () {
    var T = licy.extend(Super, {});

    var t = new T();

    sinon.assert.calledOnce(superConstructor);
    sinon.assert.calledOn(superConstructor, t);
  });

  it('does not call super constructor itself', function () {
    var T = licy.extend(Super, function () { return {}; });

    licy.create(T);

    sinon.assert.notCalled(superConstructor);
  });

  it('calls super constructor on super_ call (return)', function () {
    var T = licy.extend(Super, function Fn() {
      Fn.super_.call(this);
      return {};
    });

    var t = new T();

    sinon.assert.calledOnce(superConstructor);
    sinon.assert.calledOn(superConstructor, t);
  });

  it('calls super constructor on super_ call (ctor)', function () {
    var T = licy.extend(Super, {
      constructor: function Fn() {
        Fn.super_.call(this);
      }
    });

    var t = new T();

    sinon.assert.calledOnce(superConstructor);
    sinon.assert.calledOn(superConstructor, t);
  });

  it('does not call Licy ctor twice', function () {
    var T = licy.extend(Super, {});

    var t = new T();

    assert.equal(t.filters('destroy').length, 1);
  });

  it('does not call Licy ctor twice (ctor)', function () {
    var T = licy.extend(Super, function Fn() {
      Fn.super_.call(this);
      return {};
    });

    var t = new T();

    assert.equal(t.filters('destroy').length, 1);
  });

  it('does not destroy if super parent is destroyed', function () {
    var p1 = licy.create();
    var p2 = licy.create();
    var S = p1.define();
    var T = p2.extend(S, {});
    var s = sinon.spy();

    var t = new T();
    t.on('destroy', s);
    p1.destroy();

    sinon.assert.notCalled(s);
  });

  it('emits "create" event on each constructors prototype', function () {
    var T = licy.extend(Super, {});
    var s1 = sinon.spy();
    var s2 = sinon.spy();
    Super.prototype.on('create', s1);
    T.prototype.on('create', s2);

    licy.create(T);

    sinon.assert.calledOnce(s1);
    sinon.assert.calledOnce(s2);
  });

  it('invokes parent and child implementation of same method', function () {
    var s = sinon.spy();
    var T = licy.extend(Super, {
      test: s
    });
    var t = new T();

    t.test();

    sinon.assert.calledOnce(s);
    sinon.assert.calledOn(s, t);
    sinon.assert.calledOnce(method);
    sinon.assert.calledOn(method, t);
    sinon.assert.callOrder(s, method);
  });

  it('invokes parent and child implementation of same method (return)',
    function () {
      var s = sinon.spy();
      var T = licy.extend(Super, function Fn() {
        Fn.super_.call(this);
        return {
          test: s
        };
      });
      var t = new T();

      t.test();

      sinon.assert.calledOnce(s);
      sinon.assert.calledOn(s, t);
      sinon.assert.calledOnce(method);
      sinon.assert.calledOn(method, t);
      sinon.assert.callOrder(s, method);
    });

  it('invokes parent and child implementation of same method (async ctor)',
    function () {
      var s = sinon.spy();
      var T = licy.extend(Super, {
        constructor: function Fn(cb) {
          Fn.super_.call(this);
          cb();
        },
        test: s
      });
      var t = new T();

      t.test();

      sinon.assert.calledOnce(s);
      sinon.assert.calledOn(s, t);
      sinon.assert.calledOnce(method);
      sinon.assert.calledOn(method, t);
      sinon.assert.callOrder(s, method);
    });

  it('invokes parent and child implementation of same method (ctor)',
    function () {
      var s = sinon.spy();
      var T = licy.extend(Super, {
        constructor: function Fn() {
          Fn.super_.call(this);
        },
        test: s
      });
      var t = new T();

      t.test();

      sinon.assert.calledOnce(s);
      sinon.assert.calledOn(s, t);
      sinon.assert.calledOnce(method);
      sinon.assert.calledOn(method, t);
      sinon.assert.callOrder(s, method);
    });

  it('does not invoke super implementation if override does not call next',
    function () {
      var T = licy.extend(Super, {
        constructor: function Fn() {
          Fn.super_.call(this);
        },
        test: function (next) {
          /*jslint unparam: true*/
          return;
        }
      });
      var t = new T();

      t.test();

      sinon.assert.notCalled(method);
    });

  it('registers additional functions as listeners (return)', function () {
    var s = sinon.spy(function (a, b, c) {
      /*jslint unparam: true*/
      return;
    });
    var T = licy.extend(Super, function Fn() {
      Fn.super_.call(this);
      return {
        other: s
      };
    });
    var t = new T();

    t.other('abc', 42, true);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, 'abc', 42, true);
  });

  it('registers additional functions as listeners (ctor)', function () {
    var s = sinon.spy(function (a, b, c) {
      /*jslint unparam: true*/
      return;
    });
    var T = licy.extend(Super, {
      constructor: function Fn() {
        Fn.super_.call(this);
      },
      other: s
    });
    var t = new T();

    t.other('abc', 42, true);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, 'abc', 42, true);
  });

  it('overrides with filter on 2nd extension', function () {
    var s = sinon.spy(function (next) {
      /*jslint unparam: true*/
      return;
    });
    var T1 = licy.extend(Super, {});
    var T2 = licy.extend(T1, {
      test : s
    });
    var t = new T2();

    t.test();

    sinon.assert.calledOnce(s);
    sinon.assert.notCalled(method);
  });

  it('forwards extend calls on types to licy.extend', sinon.test(function () {
    this.spy(licy, 'extend');
    var spec = { test : sinon.spy() };

    var Child = Super.extend(spec);

    sinon.assert.calledOnce(licy.extend);
    sinon.assert.calledWith(licy.extend, Super, spec);
    assert.equal(Child, licy.extend.firstCall.returnValue);
  }));

});
