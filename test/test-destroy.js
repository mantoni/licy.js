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

var licy = require('../lib/lifecycle');


function testIllegalArgs(name, message) {
  return function () {
    try {
      licy.destroy(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('destroy', {

  after: function () {
    licy.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is error': testIllegalArgs(new Error(),
    'Expected name to be string, but it was error'),


  'should remove the plugin with the given name': function () {
    licy.plugin('to.be.removed', { start : function () {} });

    licy.destroy('to.be.removed');

    assert.equal('unknown', licy.status('to.be.removed'));
  },


  'should remove all plugins': function () {
    licy.plugin('to.be.removed.x', { start : function () {} });
    licy.plugin('to.be.removed.y', { start : function () {} });

    licy.destroy('**');

    assert.equal('unknown', licy.status('to.be.removed.x'));
    assert.equal('unknown', licy.status('to.be.removed.y'));
  },


  'should not remove other plugins': function () {
    licy.plugin('to.be.removed.x', { start : function () {} });
    licy.plugin('to.be.removed.y', { start : function () {} });

    licy.destroy('to.be.removed.x');

    assert.equal('unknown', licy.status('to.be.removed.x'));
    assert.equal('configured', licy.status('to.be.removed.y'));
  },


  'should unregister start function': function () {
    licy.plugin('test', { start : function () {} });

    licy.start('test');
    licy.destroy('test');

    /*
     * Once start throws because 'test' is unknown, change this to a try/catch
     * and assert the correct exception is thrown.
     */
    assert.doesNotThrow(function () {
      licy.start('test');
    });
  },


  'should call config.destroy': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start   : function () {},
      destroy : spy
    });

    licy.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should destroy plugin if config.destroy throws': function () {
    licy.plugin('test', {
      start   : function () {},
      destroy : sinon.stub().throws(new Error('oups!'))
    });

    try {
      licy.destroy('test');
    } catch (e) {}

    assert.equal('unknown', licy.status('test'));
  },


  'should throw if config.destroy throws': function () {
    licy.plugin('test', {
      start   : function () {},
      destroy : sinon.stub().throws(new Error('oups!'))
    });

    try {
      licy.destroy('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('oups!', e.message);
    }
  },


  'should invoke config.stop on running plugin': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy
    });
    licy.start('test');

    licy.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should not invoke config.stop on not started plugin': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy
    });

    licy.destroy('test');

    sinon.assert.notCalled(spy);
  },


  'should not invoke config.stop on stopped plugin': function () {
    var spy = sinon.spy();
    licy.plugin('test', {
      start : function () {},
      stop  : spy
    });
    licy.start('test');
    licy.stop('test');
    spy.reset();

    licy.destroy('test');

    sinon.assert.notCalled(spy);
  },


  'should not invoke config.destroy if config.stop does not complete':
    function () {
      var spy = sinon.spy();
      licy.plugin('test', {
        start   : function () {},
        stop    : function (callback) {
          // Not invoking the callback here.
        },
        destroy : spy
      });
      licy.start('test');

      licy.destroy('test');

      sinon.assert.notCalled(spy);
    }


});
