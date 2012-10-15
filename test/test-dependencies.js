/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var licy    = require('../lib/licy');


test('dependencies', {

  after: function () {
    licy.removeAllListeners();
  },


  'should start dependencies before starting plugin': function () {
    var spyA = sinon.spy();
    var spyB = sinon.spy();
    var spyC = sinon.spy();
    licy.plugin('a', { start : spyA });
    licy.plugin('b', { start : spyB });
    licy.plugin('c', {
      dependencies  : ['a', 'b'],
      start         : spyC
    });

    licy.start('c');

    sinon.assert.calledOnce(spyA);
    sinon.assert.calledOnce(spyB);
    sinon.assert.calledOnce(spyC);
    sinon.assert.callOrder(spyA, spyB, spyC);
  },


  'should not start plugin if dependency does not return': function () {
    licy.plugin('required', {
      start : function (callback) {
        // Simply not invoking callback.
      }
    });
    var spy = sinon.spy();
    licy.plugin('test', {
      dependencies  : ['required'],
      start         : spy
    });

    licy.start('test');

    sinon.assert.notCalled(spy);
  },


  'should not start plugin if dependency throws': function () {
    licy.plugin('required', {
      start : function () {
        throw new TypeError('d`oh!');
      }
    });
    var spy = sinon.spy();
    licy.plugin('test', {
      dependencies  : ['required'],
      start         : spy
    });

    try {
      licy.start('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'd`oh!');
    }
    sinon.assert.notCalled(spy);
  },


  'should not throw or start same dependency twice': function () {
    var spy = sinon.spy();
    licy.plugin('required', { start : spy });
    licy.plugin('other', {
      dependencies  : ['required'],
      start         : function () {}
    });
    licy.plugin('test', {
      dependencies  : ['required', 'other'],
      start         : function () {}
    });

    assert.doesNotThrow(function () {
      licy.start('test');
    });
    sinon.assert.calledOnce(spy);
  },


  'should expose dependencies on scope object in start': function () {
    var spy = sinon.spy();
    var a   = function A() {};
    var b   = function B() {};
    licy.plugin('a', { start : function () { return a; } });
    licy.plugin('b', { start : function () { return b; } });
    licy.plugin('test', {
      dependencies  : ['a', 'b'],
      start         : spy
    });

    licy.start('test');

    var dependencies = spy.firstCall.thisValue.dependencies;
    assert.deepEqual(dependencies, { a : a, b : b });

    /* TODO Use this nicer way after the next sinon release.
    sinon.assert.calledOn(spy, sinon.match({
      dependencies : { a : a, b : b }
    }));
    */
  },


  'should not mess up array of values for wildcard starts': function () {
    var spy = sinon.spy();
    licy.plugin('foo', { start : function () {} });
    licy.plugin('test.run', {
      dependencies  : ['foo'],
      start         : function () { return 42; }
    });

    licy.start('test.*', spy);

    sinon.assert.calledWith(spy, null, [42]);
  },


  'should resolve wildcard depedencies': function () {
    var spy = sinon.spy();
    licy.plugin('dep.a', { start : function () { return 'a'; } });
    licy.plugin('dep.b', { start : function () { return 'b'; } });
    licy.plugin('test', {
      dependencies  : ['dep.*'],
      start         : spy
    });

    licy.start('test');

    var dependencies = spy.firstCall.thisValue.dependencies;
    assert.deepEqual(dependencies, { 'dep.a' : 'a', 'dep.b' : 'b' });

    /* TODO Use this nicer way after the next sinon release.
    sinon.assert.calledOn(spy, sinon.match({
      dependencies : { 'dep.a' : 'a', 'dep.b' : 'b' }
    }));
    */
  }


});

