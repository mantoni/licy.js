/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var hub = require('hubjs');


function createPlugin(licy, name) {
  var plugin  = licy.view(name);
  var entries = [];

  function Licy() {}
  Licy.prototype = licy;
  plugin.licy    = new Licy();

  function register(type) {
    plugin.licy[type] = function (event, fn) {
      entries.push({ event : event, fn : fn });
      licy[type](event, fn);
    };
  }

  register('on');
  register('once');
  register('before');
  register('onceBefore');
  register('after');
  register('onceAfter');
  plugin.licy.addListener = plugin.licy.on;

  plugin.on('destroy', function () {
    var i, l = entries.length;
    for (i = 0; i < l; i++) {
      var entry = entries[i];
      licy.un(entry.event, entry.fn);
    }
  });

  return plugin;
}


function create() {
  var licy = hub();

  function emit(name, event, plugin) {
    licy.emit('licy.' + name + '.' + event, plugin);
  }

  var started      = false;
  var destroyOrder = [];

  licy.plugin = function (name, start) {
    if (typeof start !== 'function') {
      throw new TypeError('start must be a function');
    }
    if (started) {
      throw new Error('Cannot register plugins after start');
    }
    var startEvent   = name + '.start';
    var destroyEvent = name + '.destroy';

    licy.on('licy.' + startEvent, function () {
      licy.emit(startEvent, this.callback());
    });
    licy.on('licy.' + destroyEvent, function () {
      licy.emit(destroyEvent, this.callback());
    });

    var queue         = [];
    var queueListener = function () {
      if (this.event !== startEvent) {
        queue.push(this.callback());
      }
    };

    function queueEvents() {
      licy.before(name + '.**', queueListener);
    }

    function stopQueueEvents() {
      licy.un(name + '.**', queueListener);
    }

    function flushQueue(err) {
      var i, l = queue.length;
      for (i = 0; i < l; i++) {
        queue[i](err);
      }
      queue.length = 0; // TODO write test
    }

    var autoStarted;
    function register() {
      autoStarted = false;
      var plugin;
      queueEvents();
      licy.onceBefore(name + '.**', function () {
        if (!plugin && this.event !== startEvent &&
            this.event !== destroyEvent) {
          autoStarted = true;
          /*
           * Pass an empty function to prevent an error from being thrown.
           * Errors are passed to the emit callback or thrown there, so we
           * don't have to handle it here.
           */
          licy.emit(startEvent, function () {});
        }
      });
      licy.before(startEvent, function () {
        if (plugin) {
          if (autoStarted) {
            autoStarted = false;
            return;
          }
          throw new Error('Plugin "' + name + '" already started');
        }
        started = true;
        plugin  = createPlugin(licy, name);
        emit(name, 'starting', plugin);
        stopQueueEvents();
        if (start.length < 2) {
          start.call(null, plugin);
          return;
        }
        var callback = this.callback(30000);
        try {
          start.call(null, plugin, callback);
          queueEvents();
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
          emit(name, 'started', plugin);
        }
        stopQueueEvents();
        flushQueue(err);
      });

      licy.onceBefore(destroyEvent, function () {
        emit(name, 'destroying', plugin);
        queueEvents();
      });
      licy.onceAfter(destroyEvent, function () {
        flushQueue();
        plugin.removeAllListeners();
        register();
        emit(name, 'destroyed', plugin);
      });
    }
    licy.onceAfter(startEvent, function (err) {
      if (!err) {
        destroyOrder[autoStarted ? 'push' : 'unshift'](name);
      }
    });
    register();
  };

  licy.plugins = function (plugins) {
    if (typeof plugins !== 'object') {
      throw new TypeError('plugins must be an object');
    }
    var key;
    for (key in plugins) {
      if (plugins.hasOwnProperty(key)) {
        licy.plugin(key, plugins[key]);
      }
    }
  };

  function emits(event) {
    return function (name, callback) {
      licy.emit('licy.' + name + '.' + event, callback);
    };
  }

  function destroyNext(listener, callback) {
    if (destroyOrder.length) {
      licy.emit(destroyOrder.shift() + '.destroy', listener(function () {
        destroyNext(listener, callback);
      }));
    } else {
      listener.then(callback || function () {});
    }
  }

  licy.start   = emits('start');
  licy.destroy = emits('destroy');
  licy.restart = function (name, callback) {
    licy.destroy(name, function () {
      licy.emit('licy.' + name + '.start', callback);
    });
  };
  licy.startAll = function (callback) {
    started = true;
    licy.emit('licy.**.start', callback);
  };
  licy.destroyAll = function (callback) {
    destroyNext(hub.listen(), callback);
  };

  return licy;
}

create.listen = hub.listen;
create.View   = hub.View;

module.exports = create;
