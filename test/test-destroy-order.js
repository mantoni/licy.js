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

function register(t, name) {
  var spy = sinon.spy();
  t.licy.plugin(name, function (plugin) {
    plugin.on('destroy', spy);
  });
  return spy;
}


test('destroy-order', {

  before: function () {
    this.licy = licy();
  },


  'destroys plugins in counter order of startup': function () {
    var a = register(this, 'a');
    var b = register(this, 'b');
    var c = register(this, 'c');
    this.licy.startAll();

    this.licy.destroyAll();

    sinon.assert.callOrder(c, b, a);
  },


  'restart does not modify destroy order': function () {
    var a = register(this, 'a');
    var b = register(this, 'b');
    var c = register(this, 'c');
    this.licy.startAll();

    this.licy.restart('a');
    this.licy.destroyAll();

    sinon.assert.callOrder(c, b, a);
  },


  'destroys dependency after started plugin': function () {
    var a    = register(this, 'a');
    var b    = sinon.spy();
    var licy = this.licy;
    licy.plugin('b', function (plugin) {
      licy.emit('a.test'); // autostart
      plugin.on('destroy', b);
    });

    licy.start('b');
    licy.destroyAll();

    sinon.assert.callOrder(b, a);
  },


  'destroys auto started after normally started plugins': function () {
    var a = register(this, 'a');
    var b = register(this, 'b');

    this.licy.start('a');
    this.licy.emit('b.test');
    this.licy.destroyAll();

    sinon.assert.callOrder(a, b);
  },


  'destroys auto started plugins in start order': function () {
    var a = register(this, 'a');
    var b = register(this, 'b');
    var c = register(this, 'c');

    this.licy.emit('a.test');
    this.licy.emit('b.test');
    this.licy.emit('c.test');
    this.licy.destroyAll();

    sinon.assert.callOrder(a, b, c);
  },


  'starting an auto started plugin does not change the order': function () {
    var a = register(this, 'a');
    var b = register(this, 'b');
    var c = register(this, 'c');

    this.licy.emit('a.test');
    this.licy.emit('b.test');
    this.licy.emit('c.test');
    this.licy.start('b');
    this.licy.destroyAll();

    sinon.assert.callOrder(a, b, c);
  },


  'does not emit destroy event if start threw': function () {
    var spy = sinon.spy();
    this.licy.on('test.destroy', spy);
    this.licy.plugin('test', function () { throw new Error(); });

    this.licy.start('test', function () {});
    this.licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'waits for the previous destroy to yield': function () {
    var a = sinon.spy(function (callback) {});
    var b = sinon.spy(function (callback) {});
    this.licy.plugin('a', function (plugin) {
      plugin.on('destroy', a);
    });
    this.licy.plugin('b', function (plugin) {
      plugin.on('destroy', b);
    });
    this.licy.start('a');
    this.licy.start('b');

    this.licy.destroyAll();

    sinon.assert.calledOnce(b);
    sinon.assert.notCalled(a);

    b.invokeCallback();

    sinon.assert.calledOnce(a);
  }

});
