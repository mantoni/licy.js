/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var licy   = require('../lib/licy');


function functionReferenceTest(name) {
  return function () {
    var l = licy();
    var pl;

    l.plugin('test', function (plugin) {
      pl = plugin.licy;
    });
    l.start('test');

    assert.strictEqual(l[name], pl[name]);
  };
}

test('plugin.licy', {

  'forwards licy.emit': functionReferenceTest('emit'),
  'forwards licy.un': functionReferenceTest('un'),
  'forwards licy.removeListener': functionReferenceTest('removeListener'),
  'forwards licy.removeAllListeners':
      functionReferenceTest('removeAllListeners'),
  'forwards licy.removeAllMatching':
      functionReferenceTest('removeAllMatching'),
  'forwards licy.listeners': functionReferenceTest('listeners'),
  'forwards licy.listenersMatching':
      functionReferenceTest('listenersMatching')

});


function eventRegistrationTests(type) {
  return {

    'registers an event handler': function () {
      var l = licy();
      var s = sinon.spy();

      l.plugin('test', function (plugin) {
        plugin.licy[type]('global.event', s);
      });
      l.start('test');
      l.emit('global.event');

      sinon.assert.calledOnce(s);
    },

    'unregisters the event handler on destroy': function () {
      var l = licy();
      var s = sinon.spy();

      l.plugin('test', function (plugin) {
        plugin.licy[type]('global.event', s);
      });
      l.start('test');
      l.destroy('test');
      l.emit('global.event');

      sinon.assert.notCalled(s);
    }

  };
}


test('plugin.licy.on', eventRegistrationTests('on'));
test('plugin.licy.addListener', eventRegistrationTests('addListener'));
test('plugin.licy.once', eventRegistrationTests('once'));
test('plugin.licy.before', eventRegistrationTests('before'));
test('plugin.licy.onceBefore', eventRegistrationTests('onceBefore'));
test('plugin.licy.after', eventRegistrationTests('after'));
test('plugin.licy.onceAfter', eventRegistrationTests('onceAfter'));
