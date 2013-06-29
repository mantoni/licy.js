/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
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
      this.licy.destroy(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('destroy', {

  before: function () {
    this.licy = licy();
  },


  'should reset plugin with the given name': function () {
    var spy = sinon.spy();
    this.licy.on('licy.to.be.removed.destroyed', spy);
    this.licy.plugin('to.be.removed', function () {});
    this.licy.start('to.be.removed');

    this.licy.destroy('to.be.removed');

    sinon.assert.calledOnce(spy);
  },


  'should reset all plugins': function () {
    var spyX = sinon.spy();
    var spyY = sinon.spy();
    this.licy.on('licy.to.be.removed.x.destroyed', spyX);
    this.licy.on('licy.to.be.removed.y.destroyed', spyY);
    this.licy.plugin('to.be.removed.x', function () {});
    this.licy.plugin('to.be.removed.y', function () {});
    this.licy.start('to.be.removed.x');
    this.licy.start('to.be.removed.y');

    this.licy.destroy('**');

    sinon.assert.calledOnce(spyX);
    sinon.assert.calledOnce(spyY);
  },


  'should not invoke unrelated destroy listener': function () {
    var spy = sinon.spy();
    this.licy.on('unrelated.destroy', spy);

    this.licy.destroy('**');

    sinon.assert.notCalled(spy);
  },


  'should not reset other plugins': function () {
    var spyX = sinon.spy();
    var spyY = sinon.spy();
    this.licy.on('licy.to.be.removed.x.destroyed', spyX);
    this.licy.on('licy.to.be.removed.y.destroyed', spyY);
    this.licy.plugin('to.be.removed.x', function () {});
    this.licy.plugin('to.be.removed.y', function () {});
    this.licy.start('to.be.removed.x');
    this.licy.start('to.be.removed.y');

    this.licy.destroy('to.be.removed.x');

    sinon.assert.calledOnce(spyX);
    sinon.assert.notCalled(spyY);
  },


  'should allow to start plugin again': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);
    this.licy.start('test');
    this.licy.destroy('test');
    spy.reset();

    this.licy.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should emit destroy': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function (test) {
      test.on('destroy', spy);
    });
    this.licy.start('test');

    this.licy.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should destroy plugin if destroy throws': function () {
    var spy = sinon.spy();
    this.licy.on('licy.test.destroyed', spy);
    this.licy.plugin('test', function (test) {
      test.on('destroy', function () {
        throw new Error('oups!');
      });
    });
    this.licy.start('test');

    try {
      this.licy.destroy('test');
    } catch (e) {}

    sinon.assert.calledOnce(spy);
  },


  'should throw if destroy throws': function () {
    this.licy.plugin('test', function (test) {
      test.on('destroy', function () {
        throw new Error('oups!');
      });
    });
    this.licy.start('test');

    try {
      this.licy.destroy('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('oups!', e.message);
    }
  },


  'should invoke given callback on completion': function () {
    var spy = sinon.spy();
    var invoke;
    this.licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        invoke = callback;
      });
    });
    this.licy.start('test');

    this.licy.destroy('test', spy);

    sinon.assert.notCalled(spy);
    invoke();
    sinon.assert.calledOnce(spy);
  },


  'should remove all listeners from view': sinon.test(function () {
    var spy = sinon.spy();
    var started;
    this.licy.plugin('test', function (test, callback) {
      test.on('foo', spy);
      started = callback;
    });
    this.licy.start('test');
    started();

    this.licy.destroy('test');
    this.licy.emit('test.foo');
    // Not invoking 'started' to prevent autostart

    sinon.assert.notCalled(spy);
  }),


  'emits events in destroy listener': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function (test) {
      test.on('destroy', function () {
        test.emit('foo');
      });
    });
    this.licy.start('test');
    this.licy.on('test.foo', spy);

    this.licy.destroy('test');

    sinon.assert.calledOnce(spy);
  },


  'should not throw if not started': function () {
    var licy = this.licy;
    licy.plugin('test', function () {});

    assert.doesNotThrow(function () {
      licy.destroy('test');
    });
  },


  'should not throw if already destroyed': function () {
    var licy = this.licy;
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
      this.licy.plugin('test', function (test) {
        test.on('destroy', spy);
      });
      this.licy.onceBefore('test.destroy', function () {
        setTimeout(this.callback(), 100);
      });
      this.licy.start('test');

      this.licy.destroy('test');

      sinon.assert.notCalled(spy);

      this.clock.tick(100);

      sinon.assert.calledOnce(spy);
    }
  ),


  'should not start plugin': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);

    this.licy.destroy('test');

    sinon.assert.notCalled(spy);
  },


  'should not invoke destroy twice': sinon.test(function () {
    var callCount = 0;
    this.licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        callCount++;
        // Not invoking callback here.
      });
    });
    this.licy.start('test');

    this.licy.destroy('test');
    this.licy.destroy('test');

    assert.equal(callCount, 1);
  }),


  'should not invoke destroy twice - slow before': sinon.test(function () {
    var callCount = 0;
    this.licy.plugin('test', function (test) {
      test.on('destroy', function (callback) {
        callCount++;
        // Not invoking callback here.
      });
    });
    this.licy.onceBefore('test.destroy', function (callback) {
      setTimeout(callback, 100);
    });
    this.licy.start('test');

    this.licy.destroy('test', function () {});
    this.licy.destroy('test', function (err) { if (err) { throw err; } });
    this.clock.tick(100);

    assert.equal(callCount, 1);
  })

});
