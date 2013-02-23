# licy.js

Asynchronous dependency and lifecycle management for Node and the browser.

Repository: https://github.com/mantoni/licy.js

[![Build Status](https://secure.travis-ci.org/mantoni/licy.js.png?branch=master)](http://travis-ci.org/mantoni/licy.js)

## Install on Node

```
npm install licy
```

## Download for browsers

Browser packages are here: http://maxantoni.de/licy.js/.

## Goals

- Simple lifecycles (starting / stopping things)
- Transparent restarts of individual plugins
- All communication is event driven and asynchronous

## Usage

Some examples can be found in the [examples directory](https://github.com/mantoni/licy.js/tree/master/examples).


## API

The `licy` object is a [hub.js](http://mantoni.github.com/hub.js/) instance (a powerful event emitter).

All plugins are registered on the same event emitter. Events can be emitted on all started plugin without configuring any dependencies:

```js
licy.emit('some.plugin.event', 123, 'args', function (err, value) {
  // ...
});
```

The following API is implemented on top:

#### `plugin(name, start)`
Registers a plugin with the given name and start function.

The start function has the parameters `(plugin[, callack])`. The `plugin` is a hub.js view on the `licy` object, scoped to the name of the plugin.

If a callback is given, all events for this plugin will be queued until the callback was invoked. If the first argument to the callback is non-null, it is considered an error.

#### `startAll([callback])`
Starts all registered plugins.

The optional callback receives an error as the only argument.

#### `destroyAll([callback])`
Destroys all registered plugins.

The optional callback receives an error as the only argument.

#### `start(name[, callback])`
Starts the plugin with the given name. This will invoke the plugins start function.

The optional callback receives an error as the only argument.

If an event is emitted on `licy` that starts with `name`, the plugin will be started automatically. All events are queued until the plugin is started.

#### `destroy(name[, callback])`
Destroy the plugin with the given name. This will emit the `destroy` event on the plugin and remove all event handlers from it.

The optional callback receives an error as the only argument.

#### `restart(name[, callback])`
Destroys and then starts the plugin with the given name. This will emit the `destroy` event on the plugin, remove all event handlers from it and then invoke the start function of the plugin again.

The optional callback receives an error as the only argument.

Any events that are emitted for this this plugin during the restart will be queued until the restart was successful.

#### `reset()`
Resets the `licy` singleton to the initial state. All listeners will be removed, all plugins unregistered and all states reset. This will not destroy the plugins or emit any events.

Use this in the `tearDown` function of your unit tests.


## Contributing

If you'd like to contribute to licy.js here is how to get started:

 - Fork the project on GitHub.
 - `npm install` will setup everything you need.
 - `make` lints the code with JSLint and runs all unit tests.
 - Use can also `make lint` or `make test` individually.

Running the test cases in a browser instead of Node requires [nomo.js](https://github.com/mantoni/nomo.js).

 - Run `npm install -g nomo`
 - Run `nomo server` from within the project directory.
 - Open http://localhost:4444/test in your browser.

To build a browser package containing the merged / minified scripts run `make package`.
