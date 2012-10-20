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

var hubjs = require('hubjs');
var licy  = hubjs();


function registerPlugin(name, dependencies, start) {
  var status        = 'registered';
  var statusEvent   = 'licy.' + name + '.status';
  var requireEvent  = 'licy.' + name + '.require';
  var startEvent    = 'licy.' + name + '.start';
  var destroyEvent  = 'licy.' + name + '.destroy';
  var view;

  licy.on(statusEvent, function () {
    return status;
  });

  licy.on(requireEvent, function () {
    if (status === 'started') {
      return view;
    }
    var callback = this.callback();
    if (status === 'starting') {
      licy.after(startEvent, function wait(err) {
        licy.un(startEvent, wait);
        callback(err, view);
      });
    } else {
      licy.emit(startEvent, callback);
    }
  });

  function swallowValue(callback) {
    return function (err) {
      callback(err);
    };
  }

  licy.before(startEvent, function () {
    view = licy.view(name);
    if (status === 'starting' || status === 'started') {
      err(name, 'already started');
    }
    status = 'starting';
    if (dependencies) {
      var i, l = dependencies.length;
      for (i = 0; i < l; i++) {
        var dependency = dependencies[i];
        licy.emit('licy.' + dependency + '.require',
          swallowValue(this.callback()));
      }
    }
  });
  licy.on(startEvent, function () {
    if (start.length < 2) {
      start.call(null, view);
      return view;
    }
    start.call(null, view, this.callback());
    this.callback()(null, view);
  });
  licy.after(startEvent, function () {
    status = 'started';
  });

  licy.before(destroyEvent, function () {
    status = 'destroying';
  });
  licy.on(destroyEvent, function () {
    view.emit('destroy', this.callback());
  });
  licy.after(destroyEvent, function () {
    status = 'registered';
    view.removeAllMatching('**');
    view = null;
  });
}


var PLUGIN_NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No start function given.'
];

licy.plugin = function (name, dependencies, start) {
  if (arguments.length < 2) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
  }
  assertType(name, 'string', 'name');
  var fn = start, dep = dependencies;
  if (arguments.length === 2) {
    fn = dependencies;
    dep = null;
  } else {
    assertType(dependencies, 'array', 'dependencies');
  }
  assertType(fn, 'function', 'start');
  registerPlugin(name, dep, fn);
};


function emit(name, action, callback) {
  assertType(name, 'string', 'name');
  var strategy = name.indexOf('*') === -1 ? hubjs.LAST : hubjs.CONCAT;
  licy.emit('licy.' + name + '.' + action, strategy, callback);
}

licy.start = function (name, callback) {
  emit(name, 'start', callback);
};


licy.require = function (name, callback) {
  assertType(callback, 'function', 'callback');
  emit(name, 'require', callback);
};


licy.status = function (name) {
  assertType(name, 'string', 'name');
  var status;
  licy.emit('licy.' + name + '.status', function (err, value) {
    status = value;
  });
  return status || 'unknown';
};


licy.destroy = function (name, callback) {
  assertType(name, 'string', 'name');
  licy.emit('licy.' + name + '.destroy', callback);
};

module.exports = licy;
