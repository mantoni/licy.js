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


test('each', {

  after: function () {
    licy.removeAllListeners();
  },


  'throws if name is not string': function () {
    assert.throws(function () {
      licy.each(null, 'test');
    }, TypeError);
    assert.throws(function () {
      licy.each(123, 'test');
    }, TypeError);
  },


  'throws if event is not string': function () {
    assert.throws(function () {
      licy.each('test');
    }, TypeError);
    assert.throws(function () {
      licy.each('test', 123);
    }, TypeError);
  },


  'requires specified plugins': function () {
    var spy = sinon.spy();
    licy.plugin('some.foo', spy);

    licy.each('some.**', 'test');

    sinon.assert.calledOnce(spy);
  },


  'emits event on each required plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    licy.plugin('foo', function (foo) {
      foo.on('test', spy1);
    });
    licy.plugin('bar', function (bar) {
      bar.on('test', spy2);
    });

    licy.each('*', 'test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'passes given arguments to emit for single plugin': function () {
    var spy = sinon.spy();
    licy.plugin('foo', function (plugin) {
      plugin.on('test', spy);
    });

    licy.each('foo', 'test', 123, 'abc');

    sinon.assert.calledWith(spy, 123, 'abc');
  },


  'passes given arguments to emit for multiple plugins': function () {
    var spy = sinon.spy();
    licy.plugin('foo', function (plugin) {
      plugin.on('test', spy);
    });

    licy.each('*', 'test', 123, 'abc');

    sinon.assert.calledWith(spy, 123, 'abc');
  },


  'invokes given callback with error from emit': function () {
    var error = new Error();
    licy.plugin('foo', function (foo) {
      foo.on('test', function () {
        throw error;
      });
    });
    var spy = sinon.spy();

    licy.each('foo', 'test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, error);
  },


  'invokes given callback with result from emit': function () {
    licy.plugin('foo', function (foo) {
      foo.on('test', function () {
        return 123;
      });
    });
    var spy = sinon.spy();

    licy.each('foo', 'test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 123);
  },


  'invokes given callback with last result': function () {
    licy.plugin('foo', function (plugin) {
      plugin.on('test', function () {
        return 1;
      });
    });
    licy.plugin('bar', function (plugin) {
      plugin.on('test', function () {
        return 2;
      });
    });
    var spy = sinon.spy();

    licy.each('*', 'test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 2);
  },


  'invokes given callback with concatenated results': function () {
    licy.plugin('foo', function (plugin) {
      plugin.on('test', function () {
        return 1;
      });
    });
    licy.plugin('bar', function (plugin) {
      plugin.on('test', function () {
        return 2;
      });
    });
    var spy = sinon.spy();

    licy.each('*', 'test', licy.options({ allResults : true}), spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, [1, 2]);
  },


  'invokes given callback with error from require': function () {
    var error = new Error('oups');
    licy.plugin('foo', function () {
      throw error;
    });
    var spy = sinon.spy();

    licy.each('foo', 'test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, error);
  },


  'throws error from require if no callback is given': function () {
    var error = new Error('oups');
    licy.plugin('foo', function () {
      throw error;
    });

    try {
      licy.each('foo', 'test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, error.name);
      assert.equal(e.message, error.message);
    }
  }


});

