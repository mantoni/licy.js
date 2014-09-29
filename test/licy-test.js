/*global describe, it, beforeEach, afterEach*/
'use strict';

var assert = require('assert');
var licy   = require('..');


describe('licy', function () {

  it('is instanceof Licy', function () {
    assert(licy instanceof licy.Licy);
  });

  it('throws if given argument is null', function () {
    assert.throws(function () {
      licy.define(null);
    }, TypeError);
  });

  it('throws if given argument is undefined', function () {
    assert.throws(function () {
      licy.define(undefined);
    }, TypeError);
  });

  it('throws if given argument is array', function () {
    assert.throws(function () {
      licy.define([]);
    }, TypeError);
  });

  it('does not throw if given argument is empty plain object', function () {
    assert.doesNotThrow(function () {
      licy.define({});
    });
  });

  it('throws if the constructor is null', function () {
    assert.throws(function () {
      licy.define({ constructor : null });
    }, TypeError);
  });

  it('throws if the constructor is an object', function () {
    assert.throws(function () {
      licy.define({ constructor : {} });
    }, TypeError);
  });

});
