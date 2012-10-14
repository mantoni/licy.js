/**
 * lifecycle.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var lifecycle = require('../lib/lifecycle');


function testIllegalArgs(name, message) {
  return function () {
    try {
      lifecycle.start(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('lifecycle.start', {

  after: function () {
    lifecycle.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0,
    'Expected name to be string, but it was number'),


  'should invoke start function from config': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', { start : spy });

    lifecycle.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if start function throws': function () {
    lifecycle.plugin('test', {
      start : sinon.stub().throws(new Error('ouch'))
    });

    try {
      lifecycle.start('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should err if start function errs': function () {
    lifecycle.plugin('test', {
      start : function () {
        this.callback()(new Error('ouch'));
      }
    });

    try {
      lifecycle.start('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should invoke a given callback after starting the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    lifecycle.plugin('test', { start : spy1 });

    lifecycle.start('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the start callback to return': sinon.test(function () {
    lifecycle.plugin('test', {
      start : function (callback) {
        setTimeout(callback, 10);
      }
    });
    var spy = sinon.spy();

    lifecycle.start('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should not invoke config.start on second start attempt': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', { start : spy });
    lifecycle.start('test');
    spy.reset();

    try {
      lifecycle.start('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second start attempt': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', { start : function () {} });

    lifecycle.start('test');
    lifecycle.start('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already started'
    }));
  },


  'should err on start attempt while starting': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', { start : function () {
      lifecycle.start('test', spy);
    } });

    lifecycle.start('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already started'
    }));
  },


  'should not throw on start after stop': function () {
    lifecycle.plugin('test', { start : function () {} });

    lifecycle.start('test');
    lifecycle.stop('test');

    assert.doesNotThrow(function () {
      lifecycle.start('test');
    });
  }


});
