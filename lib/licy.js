/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
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


function registerPlugin(name, start) {
  var startEvent   = 'licy.' + name + '.start';
  var destroyEvent = 'licy.' + name + '.destroy';
  var view;

  var queue = [];
  var queueListener = function () {
    queue.push(this.callback());
  };
  function queueEvents() {
    licy.before(name + '.**', queueListener);
  }
  queueEvents();
  licy.onceBefore(name + '.**', function () {
    if (!view) {
      /*
       * Pass an empty function to prevent an error from being thrown.
       * Errors are passed to the emit callback or thrown there, so we don't
       * have to handle it here.
       */
      licy.emit(startEvent, function () {});
    }
  });

  licy.before(startEvent, function () {
    if (view) {
      err(name, 'already started');
    }
    view   = licy.view(name);
    licy.emit('licy.' + name + '.starting', view);
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
    } else {
      licy.emit('licy.' + name + '.started', view);
    }
    licy.un(name + '.**', queueListener);
    var i, l = queue.length;
    for (i = 0; i < l; i++) {
      queue[i](err);
    }
    queue.length = 0; // TODO write test
  });

  licy.before(destroyEvent, function () {
    licy.emit('licy.' + name + '.destroying', view);
  });
  licy.on(destroyEvent, function () {
    if (view) {
      view.emit('destroy', this.callback());
      view.before('destroy', function () {
        this.stop();
      });
      queueEvents();
    }
  });
  licy.after(destroyEvent, function () {
    view.removeAllListeners();
    queueEvents();
    licy.emit('licy.' + name + '.destroyed', view);
    view = null;
  });
}


var PLUGIN_NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No start function given.'
];

licy.plugin = function (name, start) {
  if (arguments.length < 2) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
  }
  assertType(name, 'string', 'name');
  assertType(start, 'function', 'start');
  registerPlugin(name, start);
};


function emit(name, action, callback) {
  assertType(name, 'string', 'name');
  var options = hub.options({ allResults : name.indexOf('*') !== -1 });
  licy.emit('licy.' + name + '.' + action, options, callback);
}

licy.start = function (name, callback) {
  emit(name, 'start', callback);
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

licy.listen  = hub.listen;
licy.View    = hub.View;
licy.options = hub.options;
licy.Options = hub.Options;

module.exports = licy;
