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
var licy   = require('..');


describe('toString', function () {

  afterEach(function () {
    licy.removeAll();
  });

  it('returns Licy for licy itself', function () {
    assert.equal(licy.toString(), '[licy Licy]');
  });

  it('defaults to Type', function () {
    var t = licy.create({});

    assert.equal(t.toString(), '[licy Type]');
  });

  it('defaults to Type (ctor)', function () {
    var t = licy.create({
      constructor: function () {
        return;
      }
    });

    assert.equal(t.toString(), '[licy Type]');
  });

  it('defaults to Type (return)', function () {
    var t = licy.create(function () {
      return {};
    });

    assert.equal(t.toString(), '[licy Type]');
  });

  it('returns function name (ctor)', function () {
    var t = licy.create({
      constructor: function Test() {
        return;
      }
    });

    assert.equal(t.toString(), '[licy Test]');
  });

  it('returns function name (return)', function () {
    var t = licy.create(function Test() {
      return {};
    });

    assert.equal(t.toString(), '[licy Test]');
  });

});
