/**
 * lifecycle.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

function typeOf(value) {
  if (value === null) {
    return 'null';
  }
  var type = Object.prototype.toString.call(value);
  return type.substring(8, type.length - 1).toLowerCase();
}

function assertType(value, expectation, name) {
  var type = typeOf(value);
  if (type !== expectation) {
    throw new TypeError('Expected ' + name + ' to be ' + expectation +
      ', but it was ' + type);
  }
}

var hubjs = require('hubjs');

var lifecycle = hubjs();


function err(name, message) {
  throw new Error('Plugin "' + name + '" ' + message);
}


function registerPlugin(name, config) {
  var status        = 'configured';
  var statusEvent   = name + '.status';
  var startEvent    = name + '.start';
  var stopEvent     = name + '.stop';
  var destroyEvent  = name + '.destroy';

  lifecycle.on(statusEvent, function () {
    return status;
  });

  lifecycle.before(startEvent, function () {
    if (status === 'starting' || status === 'started') {
      err(name, 'already started');
    }
    status = 'starting';
  });
  lifecycle.on(startEvent, config.start);
  lifecycle.after(startEvent, function () {
    status = 'started';
  });

  lifecycle.before(stopEvent, function () {
    if (status === 'stopped') {
      err(name, 'already stopped');
    }
    if (status !== 'started') {
      err(name, 'is not running');
    }
    status = 'stopping';
  });
  if (config.stop) {
    lifecycle.on(stopEvent, config.stop);
  }
  lifecycle.after(stopEvent, function () {
    status = 'stopped';
  });

  lifecycle.before(destroyEvent, function () {
    status = 'destroying';
  });
  if (config.destroy) {
    lifecycle.on(destroyEvent, config.destroy);
  }
  lifecycle.after(destroyEvent, function () {
    lifecycle.removeAllListeners(statusEvent);
    lifecycle.removeAllListeners(startEvent);
    lifecycle.removeAllListeners(stopEvent);
    lifecycle.removeAllListeners(destroyEvent);
  });
}


var PLUGIN_NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No config given.'
];

lifecycle.plugin = function (name, config) {
  if (arguments.length < 2) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
  }
  assertType(name,          'string',   'name');
  assertType(config,        'object',   'config');
  assertType(config.start,  'function', 'config.start');
  registerPlugin(name, config);
};


lifecycle.start = function (name, callback) {
  assertType(name, 'string', 'name');
  lifecycle.emit(name + '.start', callback);
};


lifecycle.stop = function (name, callback) {
  assertType(name, 'string', 'name');
  lifecycle.emit(name + '.stop', callback);
};


lifecycle.status = function (name) {
  assertType(name, 'string', 'name');
  var status;
  lifecycle.emit(name + '.status', function (err, value) {
    status = value;
  });
  return status || 'unknown';
};


lifecycle.destroy = function (name) {
  assertType(name, 'string', 'name');
  lifecycle.emit(name + '.destroy');
};

module.exports = lifecycle;
