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


test('start', {

  before: function () {
    this.licy = licy();
  },


  'should invoke start function': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);

    this.licy.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if start function throws': function () {
    this.licy.plugin('test', function () {
      throw new Error('ouch');
    });

    try {
      this.licy.start('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message.substring(e.message.length - 4));
    }
  },


  'should err if start function errs': function () {
    this.licy.plugin('test', function (test, callback) {
      callback(new Error('ouch'));
    });

    try {
      this.licy.start('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message.substring(e.message.length - 4));
    }
  },


  'should err if start function with callback throws': function () {
    this.licy.plugin('test', function (test, callback) {
      throw new Error('ouch');
    });

    try {
      this.licy.start('test');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message.substring(e.message.length - 4));
    }
  },


  'should invoke a given callback after starting the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.licy.plugin('test', spy1);

    this.licy.start('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the start callback to return': sinon.test(function () {
    this.licy.plugin('test', function (test, callback) {
      setTimeout(callback, 10);
    });
    var spy = sinon.spy();

    this.licy.start('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should pass error to start callback': function () {
    var spy = sinon.spy();
    var err = new Error();
    this.licy.plugin('test', function () { throw err; });

    this.licy.start('test', spy);

    sinon.assert.calledWith(spy, err);
  },


  'should pass null to start callback': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function () {});

    this.licy.start('test', spy);

    sinon.assert.calledWith(spy, null);
  },


  'should create different views for each wildcard start': function () {
    var spy = sinon.spy();
    var view1, view2;
    this.licy.plugin('test.1', function (test) { view1 = test; });
    this.licy.plugin('test.2', function (test) { view2 = test; });

    this.licy.start('test.*', spy);

    assert.notStrictEqual(view1, view2);
  },


  'should not invoke start on second start attempt': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);
    this.licy.start('test');
    spy.reset();

    try {
      this.licy.start('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second start attempt': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function () {});

    this.licy.start('test');
    this.licy.start('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : sinon.match('Plugin "test" already started')
    }));
  },


  'should err on start attempt while starting': function () {
    var licy = this.licy;
    var spy = sinon.spy();
    licy.plugin('test', function () {
      licy.start('test', spy);
    });

    licy.start('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : sinon.match('Plugin "test" already started')
    }));
  },


  'should throw on second start attempt without callback': function () {
    this.licy.plugin('test', function () {});
    this.licy.start('test');

    try {
      this.licy.start('test');
      assert.fail();
    } catch (e) {
      assert.equal(e.name, 'Error');
      assert(e.message.indexOf('Plugin "test" already started') !== -1);
    }
  },


  'should not throw on start after destroy': function () {
    var licy = this.licy;
    licy.plugin('test', function () {});

    licy.start('test');
    licy.destroy('test');

    assert.doesNotThrow(function () {
      licy.start('test');
    });
  },


  'should start all plugins': function () {
    var a = sinon.spy();
    var b = sinon.spy();
    this.licy.plugin('a', a);
    this.licy.plugin('b.c', b);

    this.licy.start('**');

    sinon.assert.calledOnce(a);
    sinon.assert.calledOnce(b);
  },


  'should not invoke unrelated start listener': function () {
    var spy = sinon.spy();
    this.licy.on('unrelated.start', spy);

    this.licy.start('**');

    sinon.assert.notCalled(spy);
  },


  'should not throw if already auto started': function () {
    var licy = this.licy;
    licy.plugin('a', function () {});
    licy.emit('a.foo');

    assert.doesNotThrow(function () {
      licy.start('a');
    });
  },


  'should not invoke start function if already auto started': function () {
    var spy = sinon.spy();
    this.licy.plugin('a', spy);
    this.licy.emit('a.foo');

    this.licy.start('a');

    sinon.assert.calledOnce(spy);
  },


  'should throw when starting again after restart': function () {
    var licy = this.licy;
    licy.plugin('test', function () {});
    licy.emit('test.foo'); // autostart
    licy.restart('test');

    assert.throws(function () {
      licy.start('test');
    });
  },


  'should throw when starting twice after auto start': function () {
    var licy = this.licy;
    licy.plugin('test', function () {});
    licy.emit('test.foo');

    licy.start('test'); // tolerated
    assert.throws(function () {
      licy.start('test'); // not tolerated
    });
  }

});
