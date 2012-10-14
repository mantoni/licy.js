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
      lifecycle.destroy(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('lifecycle.destroy', {

  after: function () {
    lifecycle.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is error': testIllegalArgs(new Error(),
    'Expected name to be string, but it was error'),


  'should remove the plugin with the given name': function () {
    lifecycle.plugin('to.be.removed', { start : function () {} });

    lifecycle.destroy('to.be.removed');

    assert.equal('unknown', lifecycle.status('to.be.removed'));
  },


  'should remove all plugins': function () {
    lifecycle.plugin('to.be.removed.x', { start : function () {} });
    lifecycle.plugin('to.be.removed.y', { start : function () {} });

    lifecycle.destroy('**');

    assert.equal('unknown', lifecycle.status('to.be.removed.x'));
    assert.equal('unknown', lifecycle.status('to.be.removed.y'));
  },


  'should not remove other plugins': function () {
    lifecycle.plugin('to.be.removed.x', { start : function () {} });
    lifecycle.plugin('to.be.removed.y', { start : function () {} });

    lifecycle.destroy('to.be.removed.x');

    assert.equal('unknown', lifecycle.status('to.be.removed.x'));
    assert.equal('configured', lifecycle.status('to.be.removed.y'));
  },


  'should unregister start function': function () {
    lifecycle.plugin('test', { start : function () {} });

    lifecycle.start('test');
    lifecycle.destroy('test');

    /*
     * Once start throws because 'test' is unknown, change this to a try/catch
     * and assert the correct exception is thrown.
     */
    assert.doesNotThrow(function () {
      lifecycle.start('test');
    });
  },


  'should call config.destroy': function () {
    var spy = sinon.spy();
    lifecycle.plugin('test', {
      start   : function () {},
      destroy : spy
    });

    lifecycle.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should destroy plugin if config.destroy throws': function () {
    lifecycle.plugin('test', {
      start   : function () {},
      destroy : sinon.stub().throws(new Error('oups!'))
    });

    try {
      lifecycle.destroy('test');
    } catch (e) {}

    assert.equal('unknown', lifecycle.status('test'));
  },


  'should throw if config.destroy throws': function () {
    lifecycle.plugin('test', {
      start   : function () {},
      destroy : sinon.stub().throws(new Error('oups!'))
    });

    try {
      lifecycle.destroy('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('oups!', e.message);
    }
  }


});
