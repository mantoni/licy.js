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

var lifecycle = require('../lib/lifecycle');


function testIllegalArgs(name, message) {
  return function () {
    try {
      lifecycle.status(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('lifecycle.status', {

  after: function () {
    lifecycle.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is object': testIllegalArgs(new Date(),
    'Expected name to be string, but it was date'),


  'should return "unknown" for unknown plugins': function () {
    var status = lifecycle.status('foo');

    assert.equal(status, 'unknown');
  },


  'should return "configured" for configured plugins': function () {
    lifecycle.plugin('test', { start : function () {} });

    var status = lifecycle.status('test');

    assert.equal(status, 'configured');
  },


  'should return "starting" before config.start returns': function () {
    var status;
    lifecycle.plugin('test', {
      start : function () {
        status = lifecycle.status('test');
      }
    });

    lifecycle.start('test');

    assert.equal(status, 'starting');
  },


  'should return "starting" while waiting for config.start': function () {
    lifecycle.plugin('test', {
      start : function () {
        this.callback();
        // Just not calling callback.
      }
    });

    lifecycle.start('test');
    var status = lifecycle.status('test');

    assert.equal(status, 'starting');
  },


  'should return "started" for started plugins': function () {
    lifecycle.plugin('test', { start : function () {} });
    lifecycle.start('test');

    var status = lifecycle.status('test');

    assert.equal(status, 'started');
  },


  'should return "started" after start returns': function () {
    var status;
    lifecycle.plugin('test', { start : function () {} });

    lifecycle.start('test', function () {
      status = lifecycle.status('test');
    });

    assert.equal(status, 'started');
  },


  'should return "stopping" before config.stop returns': function () {
    var status;
    lifecycle.plugin('test', {
      start : function () {},
      stop  : function () {
        status = lifecycle.status('test');
      }
    });

    lifecycle.start('test');
    lifecycle.stop('test');

    assert.equal(status, 'stopping');
  },


  'should return "stopped" for stopped plugins': function () {
    lifecycle.plugin('test', { start : function () {} });
    lifecycle.start('test');
    lifecycle.stop('test');

    var status = lifecycle.status('test');

    assert.equal(status, 'stopped');
  },


  'should return "stopped" after stop returns': function () {
    var status;
    lifecycle.plugin('test', { start : function () {} });
    lifecycle.start('test');

    lifecycle.stop('test', function () {
      status = lifecycle.status('test');
    });

    assert.equal(status, 'stopped');
  },

  'should return "destroying" while waiting for config.destroy': function () {
    lifecycle.plugin('test', {
      start   : function () {},
      destroy : function () {
        this.callback();
        // Just not calling callback.
      }
    });

    lifecycle.start('test');
    lifecycle.destroy('test');
    var status = lifecycle.status('test');

    assert.equal(status, 'destroying');
  }


});
