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


function testIllegalArgs(name, message) {
  return function () {
    try {
      licy.stop(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('stop', {

  after: function () {
    licy.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0,
    'Expected name to be string, but it was number'),


  'should invoke stop function from config': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy
    });

    licy.start('test');
    licy.stop('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if stop function throws': function () {
    licy.plugin('test', {
      start : function () {},
      stop  : sinon.stub().throws(new Error('ouch'))
    });
    licy.start('test');

    try {
      licy.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should err if stop function errs': function () {
    licy.plugin('test', {
      start : function () {},
      stop : function () {
        this.callback()(new Error('ouch'));
      }
    });
    licy.start('test');

    try {
      licy.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should invoke a given callback after stopping the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy1
    });

    licy.start('test');
    licy.stop('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the stop callback to return': sinon.test(function () {
    licy.plugin('test', {
      start : function () {},
      stop  : function (callback) {
        setTimeout(callback, 10);
      }
    });
    var spy = sinon.spy();

    licy.start('test');
    licy.stop('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should not invoke config.stop on second stop attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy
    });
    licy.start('test');
    licy.stop('test');
    spy.reset();

    try {
      licy.stop('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second stop attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', { start : function () {} });

    licy.start('test');
    licy.stop('test');
    licy.stop('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already stopped'
    }));
  },


  'should throw if plugin was yet not started': function () {
    licy.plugin('test', { start : function () {} });

    try {
      licy.stop('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('Plugin "test" is not running', e.message);
    }
  },


  'should have return value from start as instance on scope': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () { return 42; },
      stop  : spy
    });

    licy.start('test');
    licy.stop('test');

    assert.equal(spy.firstCall.thisValue.instance, 42);
  }


});
