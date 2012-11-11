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


  'should throw if dependencies are null': function () {
    try {
      licy.plugin('test', null, function () {});
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected dependencies to be array, but it was null');
    }
  },


  'should throw if dependencies are object': function () {
    try {
      licy.plugin('test', {}, function () {});
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected dependencies to be array, but it was object');
    }
  },


  'should start dependencies before starting plugin': function () {
    var spyA = sinon.spy();
    var spyB = sinon.spy();
    var spyC = sinon.spy();
    licy.plugin('a', spyA);
    licy.plugin('b', spyB);
    licy.plugin('c', ['a', 'b'], spyC);

    licy.start('c');

    sinon.assert.calledOnce(spyA);
    sinon.assert.calledOnce(spyB);
    sinon.assert.calledOnce(spyC);
    sinon.assert.callOrder(spyA, spyB, spyC);
  },


  'should resolve wildcard dependencies': function () {
    var spyA = sinon.spy();
    var spyB = sinon.spy();
    var spyC = sinon.spy();
    licy.plugin('test.a', spyA);
    licy.plugin('test.b', spyB);
    licy.plugin('c', ['test.*'], spyC);

    licy.start('c');

    sinon.assert.calledOnce(spyA);
    sinon.assert.calledOnce(spyB);
    sinon.assert.calledOnce(spyC);
    sinon.assert.callOrder(spyA, spyB, spyC);
  },


  'should not start plugin if dependency does not return': function () {
    licy.plugin('required', function (hub, callback) {
      // Simply not invoking callback.
    });
    var spy = sinon.spy();
    licy.plugin('test', ['required'], spy);

    licy.start('test');

    sinon.assert.notCalled(spy);
  },


  'should not start plugin if dependency throws': function () {
    licy.plugin('required', function () {
      throw new TypeError('d`oh!');
    });
    var spy = sinon.spy();
    licy.plugin('test', ['required'], spy);

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
    licy.plugin('required', spy);
    licy.plugin('other', ['required'], function () {});
    licy.plugin('test', ['required', 'other'], function () {});

    assert.doesNotThrow(function () {
      licy.start('test');
    });
    sinon.assert.calledOnce(spy);
  },


  'should not mess up array of values for wildcard starts with dependency':
    function () {
      var spy = sinon.spy();
      var view;
      licy.plugin('foo', function () {});
      licy.plugin('bar', function () {});
      licy.plugin('test.run', ['foo', 'bar'], function (test) {
        view = test;
      });

      licy.start('test.*', spy);

      sinon.assert.calledWith(spy, null, [view]);
    },


  'should destroy dependant plugin': function () {
    var spy = sinon.spy();
    licy.plugin('required', function () {});
    licy.plugin('test', ['required'], function (test) {
      test.on('destroy', spy);
    });

    licy.start('test');
    licy.destroy('required');

    sinon.assert.calledOnce(spy);
  },


  'should wait with destory for dependant plugin': sinon.test(function () {
    var spy = sinon.spy();
    licy.plugin('required', function (required) {
      required.on('destroy', spy);
    });
    licy.plugin('test', ['required'], function (test) {
      test.on('destroy', function (callback) {
        setTimeout(callback, 500);
      });
    });

    licy.start('test');
    licy.destroy('required');

    sinon.assert.notCalled(spy);

    this.clock.tick(500);

    sinon.assert.calledOnce(spy);
  })

});
