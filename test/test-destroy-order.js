/**
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

function register(name) {
  var spy = sinon.spy();
  licy.plugin(name, function (plugin) {
    plugin.on('destroy', spy);
  });
  return spy;
}


test('destroy-order', {

  after: function () {
    licy.reset();
  },


  'destroys plugins in counter order of startup': function () {
    var a = register('a');
    var b = register('b');
    var c = register('c');
    licy.startAll();

    licy.destroyAll();

    sinon.assert.callOrder(c, b, a);
  },


  'restart does not modify destroy order': function () {
    var a = register('a');
    var b = register('b');
    var c = register('c');
    licy.startAll();

    licy.restart('a');
    licy.destroyAll();

    sinon.assert.callOrder(c, b, a);
  },


  'destroys dependency after started plugin': function () {
    var a = register('a');
    var b = sinon.spy();
    licy.plugin('b', function (plugin) {
      licy.emit('a.test'); // autostart
      plugin.on('destroy', b);
    });

    licy.start('b');
    licy.destroyAll();

    sinon.assert.callOrder(b, a);
  },


  'destroys auto started after normally started plugins': function () {
    var a = register('a');
    var b = register('b');

    licy.start('a');
    licy.emit('b.test');
    licy.destroyAll();

    sinon.assert.callOrder(a, b);
  },


  'destroys auto started plugins in start order': function () {
    var a = register('a');
    var b = register('b');
    var c = register('c');

    licy.emit('a.test');
    licy.emit('b.test');
    licy.emit('c.test');
    licy.destroyAll();

    sinon.assert.callOrder(a, b, c);
  },


  'starting an auto started plugin does not change the order': function () {
    var a = register('a');
    var b = register('b');
    var c = register('c');

    licy.emit('a.test');
    licy.emit('b.test');
    licy.emit('c.test');
    licy.start('b');
    licy.destroyAll();

    sinon.assert.callOrder(a, b, c);
  },


  'does not emit destroy event if start threw': function () {
    var spy = sinon.spy();
    licy.on('test.destroy', spy);
    licy.plugin('test', function () { throw new Error(); });

    licy.start('test', function () {});
    licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'waits for the previous destroy to yield': function () {
    var a = sinon.spy(function (callback) {});
    var b = sinon.spy(function (callback) {});
    licy.plugin('a', function (plugin) {
      plugin.on('destroy', a);
    });
    licy.plugin('b', function (plugin) {
      plugin.on('destroy', b);
    });
    licy.start('a');
    licy.start('b');

    licy.destroyAll();

    sinon.assert.calledOnce(b);
    sinon.assert.notCalled(a);

    b.invokeCallback();

    sinon.assert.calledOnce(a);
  }

});
