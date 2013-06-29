/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var hub = require('hubjs');


function create() {
  var licy = hub();

  function emit(name, event, view) {
    licy.emit('licy.' + name + '.' + event, view);
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
      var view;
      queueEvents();
      licy.onceBefore(name + '.**', function () {
        if (!view && this.event !== startEvent &&
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
        if (view) {
          if (autoStarted) {
            autoStarted = false;
            return;
          }
          throw new Error('Plugin "' + name + '" already started');
        }
        started = true;
        view    = licy.view(name);
        emit(name, 'starting', view);
        stopQueueEvents();
        if (start.length < 2) {
          start.call(null, view);
          return;
        }
        var callback = this.callback(30000);
        try {
          start.call(null, view, callback);
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
          emit(name, 'started', view);
        }
        stopQueueEvents();
        flushQueue(err);
      });

      licy.onceBefore(destroyEvent, function () {
        emit(name, 'destroying', view);
        queueEvents();
      });
      licy.onceAfter(destroyEvent, function () {
        flushQueue();
        view.removeAllListeners();
        register();
        emit(name, 'destroyed', view);
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
