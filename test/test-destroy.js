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


  'should reset plugin with the given name': function () {
    licy.plugin('to.be.removed', function () {});
    licy.start('to.be.removed');

    licy.destroy('to.be.removed');

    assert.equal('registered', licy.status('to.be.removed'));
  },


  'should reset all plugins': function () {
    licy.plugin('to.be.removed.x', function () {});
    licy.plugin('to.be.removed.y', function () {});
    licy.start('to.be.removed.x');
    licy.start('to.be.removed.y');

    licy.destroy('**');

    assert.equal('registered', licy.status('to.be.removed.x'));
    assert.equal('registered', licy.status('to.be.removed.y'));
  },


  'should not reset other plugins': function () {
    licy.plugin('to.be.removed.x', function () {});
    licy.plugin('to.be.removed.y', function () {});
    licy.start('to.be.removed.x');
    licy.start('to.be.removed.y');

    licy.destroy('to.be.removed.x');

    assert.equal('registered', licy.status('to.be.removed.x'));
    assert.equal('started', licy.status('to.be.removed.y'));
  },


  'should allow to start plugin again': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);
    licy.start('test');
    licy.destroy('test');
    spy.reset();

    licy.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should emit destroy': function () {
    var spy = sinon.spy();
    licy.plugin('test', function (test) {
      test.on('destroy', spy);
    });
    licy.start('test');

    licy.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should destroy plugin if destroy throws': function () {
    licy.plugin('test', function (test) {
      test.on('destroy', function () {
        throw new Error('oups!');
      });
    });
    licy.start('test');

    try {
      licy.destroy('test');
    } catch (e) {}

    assert.equal('registered', licy.status('test'));
  },


  'should throw if destroy throws': function () {
    licy.plugin('test', function (test) {
      test.on('destroy', function () {
        throw new Error('oups!');
      });
    });
    licy.start('test');

    try {
      licy.destroy('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('oups!', e.message);
    }
  },


  'should invoke given callback on completion': function () {
    var spy = sinon.spy();
    var invoke;
    licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        invoke = callback;
      });
    });
    licy.start('test');

    licy.destroy('test', spy);

    sinon.assert.notCalled(spy);
    invoke();
    sinon.assert.calledOnce(spy);
  },


  'should remove all listeners from view': function () {
    var spy = sinon.spy();
    licy.plugin('test', function (test) {
      test.on('foo', spy);
    });
    licy.start('test');

    licy.destroy('test');
    licy.emit('test.foo');

    sinon.assert.notCalled(spy);
  },


  'should not throw if not started': function () {
    licy.plugin('test', function () {});

    assert.doesNotThrow(function () {
      licy.destroy('test');
    });
  },


  'should not throw if already destroyed': function () {
    licy.plugin('test', function () {});
    licy.start('test');
    licy.destroy('test');

    assert.doesNotThrow(function () {
      licy.destroy('test');
    });
  },


  'should not invoke destroy twice': function () {
    var callCount = 0;
    licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        callCount++;
        // Not invoking callback here.
      });
    });
    licy.start('test');

    licy.destroy('test');
    licy.destroy('test');

    assert.equal(callCount, 1);
  },


  'should not invoke destroy twice - slow before': sinon.test(function () {
    var callCount = 0;
    licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        callCount++;
        // Not invoking callback here.
      });
    });
    licy.before('test.destroy', function test(callback) {
      setTimeout(callback, 100);
    });
    licy.start('test');

    licy.destroy('test', function () {});
    licy.destroy('test', function (err) { if (err) { throw err; } });
    this.clock.tick(100);

    assert.equal(callCount, 1);
  })

});
