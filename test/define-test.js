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

function noop() {
  return function () { return; };
}


describe('define', function () {

  function define(constructor) {
    return licy.define({ constructor : constructor });
  }

  function create(constructor) {
    var T = define(constructor);
    return new T();
  }

  afterEach(function () {
    licy.removeAll();
  });

  it('passes instanceof test', function () {
    function Ctor() { return; }

    var t = create(Ctor);

    assert(t instanceof Ctor);
  });

  it('gets invoked', function () {
    var spy = sinon.spy();

    create(spy);

    sinon.assert.calledOnce(spy);
  });

  it('has a licy prototype (default constuctor)', function () {
    var T = licy.define();

    assert(T.prototype instanceof licy.Licy);
  });

  it('has a licy prototype (custom constuctor)', function () {
    var T = define(noop());

    assert(T.prototype instanceof licy.Licy);
  });

  it('has a licy prototype (closure)', function () {
    var T = licy.define(noop());

    assert(T.prototype instanceof licy.Licy);
  });

  it('returns a licy instance (default constuctor)', function () {
    var T = licy.define();

    var t = new T();

    assert(t instanceof licy.Licy);
  });

  it('returns a licy instance (custom constuctor)', function () {
    var t = create(noop());

    assert(t instanceof licy.Licy);
  });

  it('returns a licy instance (closure)', function () {
    var t = licy.create(noop());

    assert(t instanceof licy.Licy);
  });

  it('emits "create" event on prototype with instance', function () {
    var T = licy.define();
    var s = sinon.spy();
    T.prototype.on('instance.create', s);

    var t = new T();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, t);
  });

  it('can subscribe to events', function () {
    var spy = sinon.spy();

    var T = define(function () {
      this.on('foo', spy);
    });
    var t = new T();

    t.emit('foo');
    sinon.assert.calledOnce(spy);
  });

  it('outer hub can subscribe to inner events', function () {
    var spy = sinon.spy();
    var t = licy.create(function () {
      var self = this;
      return {
        test: function () {
          self.emit('foo');
        }
      };
    });

    t.on('foo', spy);
    t.test();

    sinon.assert.calledOnce(spy);
  });

  it('does not invoke api function on inner emit with same name', function () {
    var foo = sinon.spy();
    var spy = sinon.spy();
    var t = licy.create(function () {
      var self = this;
      return {
        test: function () {
          self.emit('foo');
        },
        foo: foo
      };
    });
    t.on('foo', spy);

    t.test();

    sinon.assert.notCalled(foo);
    sinon.assert.calledOnce(spy);
  });

  it('invokes api function with generated callback', function () {
    var cb;
    var t = licy.create(function () {
      return {
        test: function (callback) {
          cb = callback;
        }
      };
    });

    t.test();

    assert.equal(typeof cb, 'function');
  });

  it('can be used without new (custom constructor)', function () {
    var t = define(noop())();

    assert(t instanceof hubjs.Hub);
  });

  it('can be used without new (default constructor)', function () {
    var t = licy.define({})();

    assert(t instanceof hubjs.Hub);
  });

  it('emits event and invokes defined function in "on" phase', function () {
    var calls = [];
    var t = licy.create({
      test : function () { calls.push('test'); }
    });
    t.addFilter('test', function (next) {
      calls.push('before');
      next(function () { calls.push('after'); });
    });

    t.test();

    assert.deepEqual(calls, ['before', 'test', 'after']);
  });

  it('retains defined function arity', function () {
    var t = licy.create({
      test : function (a, b, c) { /*jslint unparam: true*/ return; }
    });
    t.test(); // coverage

    assert.equal(t.test.length, 3);
  });

  it('passes arguments to defined function', function () {
    var s = sinon.spy(function (a, b) { /*jslint unparam: true*/ return; });
    var t = licy.create({
      test : s
    });

    t.test(42, 'abc');

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, 42, 'abc');
  });

  function functionName(fn) {
    /*jslint regexp: true*/
    return fn.toString().match(/function ([^\(]+)/)[1];
  }

  it('retains defined function name', function () {
    var t = licy.create({
      test : function someTest() { return; }
    });
    t.test(); // coverage

    assert.equal(functionName(t.test), 'someTest');
  });

  it('uses event name as a fallback for the function name', function () {
    var t = licy.create({
      test : noop()
    });

    assert.equal(functionName(t.test), 'test');
  });

  it('invokes defined function on correct `this`', function () {
    var s = sinon.spy();
    var t = licy.create({ test : s });

    t.test();

    sinon.assert.calledOn(s, t);
  });

  it('emits event if defined function calls other function', function () {
    var s = sinon.spy();
    var t = licy.create({
      foo : function () { this.bar(); },
      bar : noop()
    });
    t.on('bar', s);

    t.foo();

    sinon.assert.calledOnce(s);
  });

  it('uses given function as constructor', function () {
    var F = function () { return; };
    var T = licy.define(F);

    var t = new T();

    assert(t instanceof F);
  });

  it('uses return value of given function as API', function () {
    var T = licy.define(function () {
      return {
        foo: noop(),
        bar: noop()
      };
    });

    var t = new T();

    assert.equal(typeof t.foo, 'function');
    assert.equal(typeof t.bar, 'function');
  });

  it('binds returned function to scope for each instance', function () {
    var s = sinon.spy(function () {
      return { test : sinon.spy() };
    });
    var T = licy.define(s);
    var t1 = new T();
    var t2 = new T();

    t1.test();
    t2.test();

    sinon.assert.calledTwice(s);
    sinon.assert.calledOnce(s.firstCall.returnValue.test);
    sinon.assert.calledOnce(s.secondCall.returnValue.test);
  });

  it('emits "define" event on root', function () {
    var s = sinon.spy();
    licy.on('define', s);

    var T = licy.define();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, T);
  });

  it('emits "define" event on parent', function () {
    var p = licy.create();
    var s = sinon.spy();
    p.on('define', s);

    var T = p.define();

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, T);
  });

  it('bubbles "define" event', function () {
    var p = licy.create();
    var s1 = sinon.spy();
    var s2 = sinon.spy();
    p.on('define', s1);
    licy.on('define', s2);

    var T = p.define();

    sinon.assert.calledOnce(s2);
    sinon.assert.calledWith(s2, T);
    sinon.assert.callOrder(s1, s2);
  });

  it('holds back events for instances until "define" returned', function () {
    var s = sinon.spy();
    var c;
    licy.on('define', function (Type, callback) {
      /*jslint unparam: true*/
      c = callback;
    });
    var T = licy.define({
      test: s
    });

    var t1 = new T();
    var t2 = new T();
    t1.test();
    t2.test();

    sinon.assert.notCalled(s);

    c();

    sinon.assert.calledTwice(s);
  });

  it('holds back "instance.create" event until "define" returned',
    function () {
      var c;
      licy.on('define', function (Type, callback) {
        /*jslint unparam: true*/
        c = callback;
      });
      var T = licy.define();
      var s = sinon.spy();
      T.prototype.on('instance.create', s);

      var t1 = new T();
      var t2 = new T();

      sinon.assert.notCalled(s);

      c();

      sinon.assert.calledTwice(s);
      sinon.assert.calledWith(s, t1, T);
      sinon.assert.calledWith(s, t2, T);
    });

  it('defines default toString', function () {
    var t = licy.create({});

    assert.equal(t.toString(), '[licy Type]');
  });

});
