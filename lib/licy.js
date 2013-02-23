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

var PLUGIN_NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No start function given.'
];

function emit(name, event, view) {
  licy.emit('licy.' + name + '.' + event, view);
}

licy.plugin = function (name, start) {
  if (arguments.length < 2) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
  }
  assertType(name, 'string', 'name');
  assertType(start, 'function', 'start');
  var startEvent   = name + '.start';
  var destroyEvent = name + '.destroy';

  licy.on('licy.' + startEvent, function () {
    licy.emit(startEvent, this.callback());
  });
  licy.on('licy.' + destroyEvent, function () {
    licy.emit(destroyEvent, this.callback());
  });

  var queue = [];
  var queueListener = function () {
    if (this.event !== startEvent) {
      queue.push(this.callback());
    }
  };
  function queueEvents() {
    licy.before(name + '.**', queueListener);
  }
  function register() {
    var autoStarted = false;
    var view;
    queueEvents();
    licy.onceBefore(name + '.**', function () {
      if (!view && this.event !== startEvent && this.event !== destroyEvent) {
        autoStarted = true;
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
        if (autoStarted) {
          autoStarted = false;
          return;
        }
        err(name, 'already started');
      }
      view = licy.view(name);
      emit(name, 'starting', view);
      if (start.length < 2) {
        start.call(null, view);
        return;
      }
      var callback = this.callback(5000);
      try {
        start.call(null, view, callback);
      } catch (e) {
        callback(e);
      }
    });
    licy.onceAfter(startEvent, function (err) {
      if (err) {
        var message = err.message;
        err.message = 'Failed to start plugin "' + name + '"';
        if (message) {
          err.message += ': ' + message;
        }
      } else {
        emit(name, 'started', view);
      }
      licy.un(name + '.**', queueListener);
      var i, l = queue.length;
      for (i = 0; i < l; i++) {
        queue[i](err);
      }
      queue.length = 0; // TODO write test
    });

    licy.onceBefore(destroyEvent, function () {
      emit(name, 'destroying', view);
      queueEvents();
    });
    licy.onceAfter(destroyEvent, function () {
      view.removeAllListeners();
      register();
      emit(name, 'destroyed', view);
    });
  }
  register();
};

licy.plugins = function (plugins) {
  if (!arguments.length) {
    throw new TypeError(PLUGIN_NOT_ENOUGH_ARGS_ERRORS[0]);
  }
  assertType(plugins, 'object', 'plugins');
  var key;
  for (key in plugins) {
    if (plugins.hasOwnProperty(key)) {
      licy.plugin(key, plugins[key]);
    }
  }
};

function emits(event) {
  return function (name, callback) {
    assertType(name, 'string', 'name');
    licy.emit('licy.' + name + '.' + event, callback);
  };
}

licy.start   = emits('start');
licy.destroy = emits('destroy');
licy.restart = function (name, callback) {
  licy.destroy(name, function () {
    licy.emit('licy.' + name + '.start', callback);
  });
};
licy.startAll = function (callback) {
  licy.emit('licy.**.start', callback);
};
licy.destroyAll = function (callback) {
  licy.emit('licy.**.destroy', callback);
};

licy.listen  = hub.listen;
licy.View    = hub.View;
licy.options = hub.options;
licy.Options = hub.Options;

module.exports = licy;
