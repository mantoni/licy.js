/*
 * licy.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it, beforeEach, afterEach*/
'use strict';

var assert = require('assert');
var sinon  = require('sinon');
var licy   = require('..');


describe('destroyWith', function () {

  it('destroys given instance on destroy', function () {
    var parent = licy.create();
    var child = licy.create();
    sinon.spy(child, 'destroy');

    child.destroyWith(parent);
    parent.destroy();

    sinon.assert.calledOnce(child.destroy);
  });

  it('does not destroy parent until child was destroyed', function () {
    var parent = licy.create();
    var callback;
    var child = licy.create({
      destroy: function (cb) {
        callback = cb;
      }
    });
    var spy = sinon.spy();
    parent.on('destroy', spy);

    child.destroyWith(parent);
    parent.destroy();

    sinon.assert.notCalled(spy);
    callback();
    sinon.assert.calledOnce(spy);
  });

});
