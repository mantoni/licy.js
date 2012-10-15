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
var licy  = hubjs();


function err(name, message) {
  throw new Error('Plugin "' + name + '" ' + message);
}


function registerPlugin(name, config) {
  var status        = 'configured';
  var statusEvent   = name + '.status';
  var startEvent    = name + '.start';
  var stopEvent     = name + '.stop';
  var destroyEvent  = name + '.destroy';

  licy.on(statusEvent, function () {
    return status;
  });

  licy.before(startEvent, function () {
    if (status === 'starting' || status === 'started') {
      err(name, 'already started');
    }
    status = 'starting';
  });
  licy.on(startEvent, config.start);
  licy.after(startEvent, function () {
    status = 'started';
  });

  licy.before(stopEvent, function () {
    if (status === 'stopped') {
      err(name, 'already stopped');
    }
    if (status !== 'started') {
      err(name, 'is not running');
    }
    status = 'stopping';
  });
  if (config.stop) {
    licy.on(stopEvent, config.stop);
  }
  licy.after(stopEvent, function () {
    status = 'stopped';
  });

  licy.before(destroyEvent, function () {
    status = 'destroying';
  });
  if (config.destroy) {
    licy.on(destroyEvent, config.destroy);
  }
  licy.after(destroyEvent, function () {
    licy.removeAllListeners(statusEvent);
    licy.removeAllListeners(startEvent);
    licy.removeAllListeners(stopEvent);
    licy.removeAllListeners(destroyEvent);
  });
}


var PLUGIN_NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No config given.'
];

licy.plugin = function (name, config) {
  if (arguments.length < 2) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
  }
  assertType(name,          'string',   'name');
  assertType(config,        'object',   'config');
  assertType(config.start,  'function', 'config.start');
  registerPlugin(name, config);
};


licy.start = function (name, callback) {
  assertType(name, 'string', 'name');
  licy.emit(name + '.start', callback);
};


licy.stop = function (name, callback) {
  assertType(name, 'string', 'name');
  licy.emit(name + '.stop', callback);
};


licy.status = function (name) {
  assertType(name, 'string', 'name');
  var status;
  licy.emit(name + '.status', function (err, value) {
    status = value;
  });
  return status || 'unknown';
};


licy.destroy = function (name) {
  assertType(name, 'string', 'name');
  licy.emit(name + '.destroy');
};

module.exports = licy;
