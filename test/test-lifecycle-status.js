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

var licy = require('../lib/lifecycle');


function testIllegalArgs(name, message) {
  return function () {
    try {
      licy.status(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('status', {

  after: function () {
    licy.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is object': testIllegalArgs(new Date(),
    'Expected name to be string, but it was date'),


  'should return "unknown" for unknown plugins': function () {
    var status = licy.status('foo');

    assert.equal(status, 'unknown');
  },


  'should return "configured" for configured plugins': function () {
    licy.plugin('test', { start : function () {} });

    var status = licy.status('test');

    assert.equal(status, 'configured');
  },


  'should return "starting" before config.start returns': function () {
    var status;
    licy.plugin('test', {
      start : function () {
        status = licy.status('test');
      }
    });

    licy.start('test');

    assert.equal(status, 'starting');
  },


  'should return "starting" while waiting for config.start': function () {
    licy.plugin('test', {
      start : function () {
        this.callback();
        // Just not calling callback.
      }
    });

    licy.start('test');
    var status = licy.status('test');

    assert.equal(status, 'starting');
  },


  'should return "started" for started plugins': function () {
    licy.plugin('test', { start : function () {} });
    licy.start('test');

    var status = licy.status('test');

    assert.equal(status, 'started');
  },


  'should return "started" after start returns': function () {
    var status;
    licy.plugin('test', { start : function () {} });

    licy.start('test', function () {
      status = licy.status('test');
    });

    assert.equal(status, 'started');
  },


  'should return "stopping" before config.stop returns': function () {
    var status;
    licy.plugin('test', {
      start : function () {},
      stop  : function () {
        status = licy.status('test');
      }
    });

    licy.start('test');
    licy.stop('test');

    assert.equal(status, 'stopping');
  },


  'should return "stopped" for stopped plugins': function () {
    licy.plugin('test', { start : function () {} });
    licy.start('test');
    licy.stop('test');

    var status = licy.status('test');

    assert.equal(status, 'stopped');
  },


  'should return "stopped" after stop returns': function () {
    var status;
    licy.plugin('test', { start : function () {} });
    licy.start('test');

    licy.stop('test', function () {
      status = licy.status('test');
    });

    assert.equal(status, 'stopped');
  },

  'should return "destroying" while waiting for config.destroy': function () {
    licy.plugin('test', {
      start   : function () {},
      destroy : function () {
        this.callback();
        // Just not calling callback.
      }
    });

    licy.start('test');
    licy.destroy('test');
    var status = licy.status('test');

    assert.equal(status, 'destroying');
  }


});
