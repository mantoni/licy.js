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


var hub  = require('hubjs');
var licy = hub();


function doesEmit(event) {
  return function () {
    licy.emit(event, this.callback());
  };
}

function requirePlugin(name, destructor, callback) {
  licy.emit('licy.' + name + '.require', function (err, dep) {
    if (!err) {
      dep.before('destroy', destructor);
    }
    callback(err);
  });
}


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
      licy.onceAfter(startEvent, function (err) {
        callback(err, view);
      });
    } else {
      licy.emit(startEvent, callback);
    }
  });

  licy.before(startEvent, function () {
    view = licy.view(name);
    if (status === 'starting' || status === 'started') {
      err(name, 'already ' + status);
    }
    status = 'starting';
    licy.emit('licy.' + name + '.starting', view);
    if (dependencies) {
      var destructor = doesEmit(destroyEvent);
      var i, l = dependencies.length;
      for (i = 0; i < l; i++) {
        requirePlugin(dependencies[i], destructor, this.callback());
      }
    }
  });
  licy.on(startEvent, function () {
    if (start.length < 2) {
      start.call(null, view);
      return view;
    }
    var callback = this.callback(5000);
    try {
      start.call(null, view, callback);
      this.callback.push(view);
    } catch (e) {
      callback(e);
    }
  });
  licy.after(startEvent, function (err) {
    if (err) {
      var message = err.message;
      err.message = 'Failed to start plugin "' + name + '"';
      if (message) {
        err.message += ': ' + message;
      }
      status = 'registered';
    } else {
      status = 'started';
      licy.emit('licy.' + name + '.started', view);
    }
  });

  licy.before(destroyEvent, function () {
    status = 'destroying';
    licy.emit('licy.' + name + '.destroying', view);
  });
  licy.on(destroyEvent, function () {
    if (view) {
      view.emit('destroy', this.callback());
      view.removeAllMatching('**');
    }
  });
  licy.after(destroyEvent, function () {
    licy.emit('licy.' + name + '.destroyed', view);
    status = 'registered';
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
  var options = hub.options({ allResults : name.indexOf('*') !== -1 });
  licy.emit('licy.' + name + '.' + action, options, callback);
}

licy.start = function (name, callback) {
  emit(name, 'start', callback);
};

licy.require = function (name, callback) {
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

licy.restart = function (name, callback) {
  assertType(name, 'string', 'name');
  licy.emit('licy.' + name + '.destroy', function () {
    emit(name, 'start', callback);
  });
};

licy.each = function (name, event) {
  assertType(name, 'string', 'name');
  assertType(event, 'string', 'event');
  var args = [name + '.' + event].concat(
    Array.prototype.slice.call(arguments, 2)
  );
  licy.emit('licy.' + name + '.require', function (err) {
    if (err) {
      var callback = args[args.length - 1];
      if (typeof callback !== 'function') {
        throw err;
      }
      callback(err);
    } else {
      licy.emit.apply(licy, args);
    }
  });
};

licy.listen  = hub.listen;
licy.View    = hub.View;
licy.options = hub.options;
licy.Options = hub.Options;

module.exports = licy;
