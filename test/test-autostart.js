/*
 * licy.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var licy   = require('../lib/licy');


test('autostart', {

  before: function () {
    this.licy = licy();
  },


  'starts plugin if event is triggered': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);

    this.licy.emit('test.foo');

    sinon.assert.calledOnce(spy);
  },


  'invokes callback once plugin was started': function () {
    var spy = sinon.spy();
    var start = sinon.spy(function (plugin, callback) {});
    this.licy.plugin('test', start);

    this.licy.emit('test.foo', spy);

    sinon.assert.notCalled(spy);

    start.invokeCallback();

    sinon.assert.calledOnce(spy);
  },


  'emits event on plugin': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.on('foo', spy);
    });

    this.licy.emit('test.foo');

    sinon.assert.calledOnce(spy);
  },


  'emit event on plugin started by wildcard emit': function () {
    var spy = sinon.spy();
    this.licy.plugin('some.test', function (plugin) {
      plugin.on('foo', spy);
    });

    this.licy.emit('some.*.foo');

    sinon.assert.calledOnce(spy);
  },


  'emits event on plugin after start yielded': function () {
    var spy   = sinon.spy();
    var start = sinon.spy(function (plugin, callback) {
      plugin.on('foo', spy);
    });
    this.licy.plugin('test', start);

    this.licy.emit('test.foo');

    sinon.assert.notCalled(spy);

    start.invokeCallback();

    sinon.assert.calledOnce(spy);
  },


  'emits event on plugins after wildcard start yielded': function () {
    var spyA   = sinon.spy();
    var startA = sinon.spy(function (plugin, callback) {
      plugin.on('foo', spyA);
    });
    var spyB   = sinon.spy();
    var startB = sinon.spy(function (plugin, callback) {
      plugin.on('foo', spyB);
    });
    this.licy.plugin('test.a', startA);
    this.licy.plugin('test.b', startB);

    this.licy.emit('test.*.foo');

    sinon.assert.notCalled(spyA);
    sinon.assert.notCalled(spyB);

    startA.invokeCallback();

    sinon.assert.notCalled(spyA);
    sinon.assert.notCalled(spyB);

    startB.invokeCallback();

    sinon.assert.calledOnce(spyA);
    sinon.assert.calledOnce(spyB);
  },


  'does not queue emitted events in sync start': function () {
    var started  = sinon.spy();
    var required = sinon.spy();
    this.licy.on('test.required', required);
    this.licy.plugin('test', function (plugin) {
      plugin.emit('required');
      started();
    });

    this.licy.emit('test.foo');

    sinon.assert.calledOnce(started);
    sinon.assert.calledOnce(required);
    sinon.assert.callOrder(required, started);
  },


  'does not queue emitted events in async start': function () {
    var started  = sinon.spy();
    var required = sinon.spy(function (callback) {});
    this.licy.on('test.required', required);
    this.licy.plugin('test', function (plugin, callback) {
      plugin.emit('required', callback);
    });

    this.licy.emit('test.foo', started);

    sinon.assert.notCalled(started);
    sinon.assert.calledOnce(required);

    required.invokeCallback();

    sinon.assert.calledOnce(started);
  },


  'passes arguments to listener on plugin': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.on('foo', spy);
    });

    this.licy.emit('test.foo', 123, 'abc');

    sinon.assert.calledWith(spy, 123, 'abc');
  },


  'invokes callback once listener on plugin yields': function () {
    var listener = sinon.spy(function (callback) {});
    this.licy.plugin('test', function (plugin) {
      plugin.on('foo', listener);
    });
    var spy = sinon.spy();

    this.licy.emit('test.foo', spy);

    sinon.assert.notCalled(spy);

    listener.invokeCallback();

    sinon.assert.calledOnce(spy);
  },


  'passes error from start function to emit callback': function () {
    var err = new Error();
    this.licy.plugin('test', function (plugin) { throw err; });
    var spy = sinon.spy();

    this.licy.emit('test.foo', spy);

    sinon.assert.calledWith(spy, err);
  },


  'passes errors from start callback to emit callbacks': function () {
    var err = new Error();
    var started;
    this.licy.plugin('test', function (plugin, callback) {
      started = callback;
    });
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.licy.emit('test.foo', spy1);
    this.licy.emit('test.bar', spy2);
    started(err);

    sinon.assert.calledWith(spy1, err);
    sinon.assert.calledWith(spy2, err);
  },


  'queues additional events until the plugin is started': function () {
    var spy = sinon.spy();
    var initialized;
    this.licy.plugin('test', function (plugin, callback) {
      plugin.on('foo', spy);
      initialized = callback;
    });

    this.licy.emit('test.foo', 1);
    this.licy.emit('test.foo', 2);
    this.licy.emit('test.foo', 3);

    sinon.assert.notCalled(spy);

    initialized();

    sinon.assert.calledThrice(spy);
    sinon.assert.calledWith(spy, 1);
    sinon.assert.calledWith(spy, 2);
    sinon.assert.calledWith(spy, 3);
  },


  'invokes all types of listeners on plugin once started': function () {
    var before = sinon.spy();
    var on     = sinon.spy();
    var after  = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.before('foo', before);
      plugin.on('foo', on);
      plugin.after('foo', after);
    });

    this.licy.emit('test.foo');

    sinon.assert.calledOnce(before);
    sinon.assert.calledOnce(on);
    sinon.assert.calledOnce(after);
  },


  'invokes all types of listeners on plugin if already started': function () {
    var before = sinon.spy();
    var on     = sinon.spy();
    var after  = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.before('foo', before);
      plugin.on('foo', on);
      plugin.after('foo', after);
    });
    this.licy.start('test');

    this.licy.emit('test.foo');

    sinon.assert.calledOnce(before);
    sinon.assert.calledOnce(on);
    sinon.assert.calledOnce(after);
  },


  'invokes all types of matchers on plugin once started': function () {
    var before = sinon.spy();
    var on     = sinon.spy();
    var after  = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.before('foo.*', before);
      plugin.on('foo.*', on);
      plugin.after('foo.*', after);
    });

    this.licy.emit('test.foo.*');

    sinon.assert.notCalled(before); // not supported for the time being
    sinon.assert.calledOnce(on);
    sinon.assert.calledOnce(after);
  },


  'invokes all types of matchers on plugin if already started': function () {
    var before = sinon.spy();
    var on     = sinon.spy();
    var after  = sinon.spy();
    this.licy.plugin('test', function (plugin) {
      plugin.before('foo.*', before);
      plugin.on('foo.*', on);
      plugin.after('foo.*', after);
    });
    this.licy.start('test');

    this.licy.emit('test.foo.*');

    sinon.assert.calledOnce(before);
    sinon.assert.calledOnce(on);
    sinon.assert.calledOnce(after);
  }

});
