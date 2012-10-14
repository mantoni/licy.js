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
      lifecycle.stop(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('lifecycle.stop', {

  after: function () {
    lifecycle.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0,
    'Expected name to be string, but it was number'),


  'should invoke stop function from config': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', {
      start : function () {},
      stop  : spy
    });

    lifecycle.start('test');
    lifecycle.stop('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if stop function throws': function () {
    lifecycle.plugin('test', {
      start : function () {},
      stop  : sinon.stub().throws(new Error('ouch'))
    });
    lifecycle.start('test');

    try {
      lifecycle.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should err if stop function errs': function () {
    lifecycle.plugin('test', {
      start : function () {},
      stop : function () {
        this.callback()(new Error('ouch'));
      }
    });
    lifecycle.start('test');

    try {
      lifecycle.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should invoke a given callback after stopping the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    lifecycle.plugin('test', {
      start : function () {},
      stop  : spy1
    });

    lifecycle.start('test');
    lifecycle.stop('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the stop callback to return': sinon.test(function () {
    lifecycle.plugin('test', {
      start : function () {},
      stop  : function (callback) {
        setTimeout(callback, 10);
      }
    });
    var spy = sinon.spy();

    lifecycle.start('test');
    lifecycle.stop('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should not invoke config.stop on second stop attempt': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', {
      start : function () {},
      stop  : spy
    });
    lifecycle.start('test');
    lifecycle.stop('test');
    spy.reset();

    try {
      lifecycle.stop('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second stop attempt': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', { start : function () {} });

    lifecycle.start('test');
    lifecycle.stop('test');
    lifecycle.stop('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already stopped'
    }));
  },


  'should throw if plugin was yet not started': function () {
    lifecycle.plugin('test', { start : function () {} });

    try {
      lifecycle.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('Plugin "test" is not running', e.message);
    }
  }


});
