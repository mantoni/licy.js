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
    var spy = sinon.spy();
    licy.on('licy.to.be.removed.destroyed', spy);
    licy.plugin('to.be.removed', function () {});
    licy.start('to.be.removed');

    licy.destroy('to.be.removed');

    sinon.assert.calledOnce(spy);
  },


  'should reset all plugins': function () {
    var spyX = sinon.spy();
    var spyY = sinon.spy();
    licy.on('licy.to.be.removed.x.destroyed', spyX);
    licy.on('licy.to.be.removed.y.destroyed', spyY);
    licy.plugin('to.be.removed.x', function () {});
    licy.plugin('to.be.removed.y', function () {});
    licy.start('to.be.removed.x');
    licy.start('to.be.removed.y');

    licy.destroy('**');

    sinon.assert.calledOnce(spyX);
    sinon.assert.calledOnce(spyY);
  },


  'should not invoke unrelated destroy listener': function () {
    var spy = sinon.spy();
    licy.on('unrelated.destroy', spy);

    licy.destroy('**');

    sinon.assert.notCalled(spy);
  },


  'should not reset other plugins': function () {
    var spyX = sinon.spy();
    var spyY = sinon.spy();
    licy.on('licy.to.be.removed.x.destroyed', spyX);
    licy.on('licy.to.be.removed.y.destroyed', spyY);
    licy.plugin('to.be.removed.x', function () {});
    licy.plugin('to.be.removed.y', function () {});
    licy.start('to.be.removed.x');
    licy.start('to.be.removed.y');

    licy.destroy('to.be.removed.x');

    sinon.assert.calledOnce(spyX);
    sinon.assert.notCalled(spyY);
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
    var spy = sinon.spy();
    licy.on('licy.test.destroyed', spy);
    licy.plugin('test', function (test) {
      test.on('destroy', function () {
        throw new Error('oups!');
      });
    });
    licy.start('test');

    try {
      licy.destroy('test');
    } catch (e) {}

    sinon.assert.calledOnce(spy);
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


  'should remove all listeners from view': sinon.test(function () {
    var spy = sinon.spy();
    var started;
    licy.plugin('test', function (test, callback) {
      test.on('foo', spy);
      started = callback;
    });
    licy.start('test');
    started();

    licy.destroy('test');
    licy.emit('test.foo');
    // Not invoking 'started' to prevent autostart

    sinon.assert.notCalled(spy);
  }),


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


  'invokes destroy after slow before listener yields': sinon.test(
    function () {
      var spy = sinon.spy();
      licy.plugin('test', function (test) {
        test.on('destroy', spy);
      });
      licy.onceBefore('test.destroy', function () {
        setTimeout(this.callback(), 100);
      });
      licy.start('test');

      licy.destroy('test');

      sinon.assert.notCalled(spy);

      this.clock.tick(100);

      sinon.assert.calledOnce(spy);
    }
  ),


  'should not start plugin': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);

    licy.destroy('test');

    sinon.assert.notCalled(spy);
  },


  'should not invoke destroy twice': sinon.test(function () {
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
  }),


  'should not invoke destroy twice - slow before': sinon.test(function () {
    var callCount = 0;
    licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        callCount++;
        // Not invoking callback here.
      });
    });
    licy.onceBefore('test.destroy', function (callback) {
      setTimeout(callback, 100);
    });
    licy.start('test');

    licy.destroy('test', function () {});
    licy.destroy('test', function (err) { if (err) { throw err; } });
    this.clock.tick(100);

    assert.equal(callCount, 1);
  })

});
