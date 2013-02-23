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


test('reset', {

  'removes all listeners': sinon.test(function () {
    this.stub(licy, 'removeAllListeners');

    licy.reset();

    sinon.assert.calledOnce(licy.removeAllListeners);
  }),


  'clears the list of started plugins': function () {
    licy.plugin('test', function () {});
    licy.start('test');
    var spy = sinon.spy();

    licy.reset();
    licy.on('test.destroy', spy);
    licy.destroyAll();

    sinon.assert.notCalled(spy);
  }

});
