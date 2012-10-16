/**
 * licy.js
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

function err(name, message) {
  throw new Error('Plugin "' + name + '" ' + message);
}

function dependencyInstaller(deps) {
  return function (raw) {
    var i, l = raw.length;
    for (i = 0; i < l; i++) {
      deps[raw[i][0]] = raw[i][1];
    }
  };
}


var hubjs = require('hubjs');
var licy  = hubjs();


function registerPlugin(name, config) {
  var status        = 'configured';
  var statusEvent   = name + '.status';
  var requireEvent  = name + '.require';
  var startEvent    = name + '.start';
  var stopEvent     = name + '.stop';
  var destroyEvent  = name + '.destroy';
  var instance;

  licy.on(statusEvent, function () {
    return status;
  });

  licy.on(requireEvent, function () {
    if (status === 'started') {
      return [name, instance];
    }
    var callback = this.callback();
    if (status === 'starting') {
      licy.after(startEvent, function wait(err) {
        licy.un(startEvent, wait);
        callback(err, [name, instance]);
      });
    } else {
      licy.emit(startEvent, function (err) {
        callback(err, [name, instance]);
      });
    }
  });

  licy.before(startEvent, function () {
    if (status === 'starting' || status === 'started') {
      err(name, 'already started');
    }
    status = 'starting';
    var dependencies = config.dependencies;
    if (dependencies) {
      var deps      = this.dependencies = {};
      var strategy  = dependencyInstaller(deps);
      var i, l = dependencies.length;
      for (i = 0; i < l; i++) {
        licy.emit(dependencies[i] + '.require', strategy, this.callback());
      }
    }
  });
  licy.on(startEvent, config.start);
  licy.after(startEvent, function (err, value) {
    instance  = value;
    status    = 'started';
  });

  licy.before(stopEvent, function () {
    if (status === 'stopped') {
      err(name, 'already stopped');
    }
    if (status !== 'started') {
      err(name, 'is not running');
    }
    status = 'stopping';
    this.instance = instance;
  });
  if (config.stop) {
    licy.on(stopEvent, config.stop);
  }
  licy.after(stopEvent, function () {
    status    = 'stopped';
    instance  = null;
  });

  licy.before(destroyEvent, function () {
    if (status === 'started') {
      licy.emit(stopEvent, this.callback());
    }
    status = 'destroying';
  });
  if (config.destroy) {
    licy.on(destroyEvent, config.destroy);
  }
  licy.after(destroyEvent, function () {
    licy.removeAllListeners(statusEvent);
    licy.removeAllListeners(requireEvent);
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
  assertType(name, 'string', 'name');
  if (typeOf(config) === 'function') {
    registerPlugin(name, { start : config });
  } else {
    assertType(config,        'object',   'config');
    assertType(config.start,  'function', 'config.start');
    registerPlugin(name, config);
  }
};


var DEFAULT_CALLBACK = function (err) {
  if (err) {
    throw err;
  }
};

function strategyForName(name) {
  return name.indexOf('*') === -1 ? hubjs.LAST : hubjs.CONCAT;
}

licy.start = function (name, callback) {
  assertType(name, 'string', 'name');
  var strategy = strategyForName(name);
  licy.emit(name + '.start', strategy, callback || DEFAULT_CALLBACK);
};


licy.require = function (name, callback) {
  assertType(name, 'string', 'name');
  assertType(callback, 'function', 'callback');
  var deps      = {};
  var strategy  = dependencyInstaller(deps);
  licy.emit(name + '.require', strategy, function (err) {
    callback(err, deps);
  });
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
