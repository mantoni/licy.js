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

## Usage

```js
var licy = require('licy');

licy.plugin('greeter', function (greeter) {
  greeter.on('hello', function () {
    return 'Oh, hi world!';
  });
});

licy.start('greeter', function (err, greeter) {
  greeter.emit('hello', function (err, result) {
    console.log(hello);
  });
});
```

More examples can be found in the [examples directory](https://github.com/mantoni/licy.js/tree/master/examples).


## Concept

Licy does three things:

 - Dependency resolution
 - Lifecycle management
 - Instance decoupling

#### Dependency resolution

Licy acts as a wrapper around your modules. It resolves other configured plugins, but leaves the dependency injection to you.

Dependencies are resolved asynchronously, allowing multiple plugins to be started in parallel.
A plugins function is invoked after all required dependencies where successfully started.

Other plugins can be declared explicitly, or a group of plugins can be required by naming convention.

```js
licy.plugin('http.server', ['routers.**'], function (httpServer) {
  // ...
});
```

#### Lifecycle management

The lifecycle of a plugin is very simple. It can be configured, started or destroyed.
This allows an application to start, restart and destroy trees of plugins.

Plugins can be started and destroyed explicitly, or as a group:

```js
licy.start('server.*');
licy.destroy('server.*');
```

All configured plugins can be addressed by starting `**`.

#### Instance decoupling

All plugins communicate only via pub/sub with each other. This allows a plugin in the middle of a dependency tree to be restarted without affecting any other plugins.

#### Callbacks

Any lifecycle function may declare a `callback` parameter to make it asynchronous.
All depending plugins will have to wait until this callback is invoked.

Licy uses node style callbacks. So wherever a callback can be used, the parameter list is `(err, value)`.

All functions can be made asynchronous by declaring a callback argument. The operation is considered completed once that callback function is invoked.

## API

The `licy` object is a [hub.js](http://mantoni.github.com/hub.js/) instance (a powerful event emitter).

All plugins are registered on the same event emitter. Events can be emitted on all started plugin without configuring any dependencies:

```js
licy.emit('some.plugin.event', 123, 'args', function (err, value) {
  // ...
});
```

The following API is implemented on top:

#### `plugin(name[, dependencies], start)`
Registers a plugin with the given name, optional dependencies and start function. The start function will receive a hub.js view on the `licy` object (the licy event emitter scoped to the name of the plugin).

Dependencies only need to be specified if a plugin cannot properly work without other plugins, or if you want them to be started before your plugin. Otherwise dependencies can be `required` lazy as needed.

If a dependency of a plugin is destroyed, the dependant plugin will be automatically destroyed first. This way it's save to destroy `**`.

#### `start(name[, callback])`
Starts the plugin with the given name. This calls `require` for all dependencies and invoke the start function of the plugin.

The optional callback is invoked with `(err, plugin)` where plugin is the same object that was passed to the start function. If `*` was used in the plugin name, this is an array of plugins.

#### `destroy(name[, callback])`
Destroy the plugin with the given name. This will destroy all dependant plugins, emit the `destroy` event on the plugin and remove all event handlers from it.

#### `require(name, callback)`
Requires a plugin. The callback is invoked with `(err, plugin)` where plugin is the same object that was passed to the start function. If `*` was used in the plugin name, this is an array of plugins.
If the plugin is not running, it will be started.

#### `restart(name[, callback])`
Destroys and then starts the plugin with the given name. This will emit the `destroy` event on the plugin, remove all event handlers from it and then invoke the start function of the plugin.

The optional callback is invoked with `(err, plugin)` where plugin is the same object that was passed to the start function. If `*` was used in the plugin name, this is an array of plugins.

It is save to call restart on a plugin that is not running.

#### `status(name)`
Returns the status of the given plugin. This can be one of `registered`, `starting`, `started`, `destroying` or `unknown`.

 - `registered` means the plugin is known, but not started.
 - `starting` means `start` was called for this plugin, but did not return yet.
 - `started` means `start` that startup was completed successfully.
 - `destroying` means the `destroy` event was fired, but did not return yet.
 - `unknown` means that there is no plugin with the given name.

Note that after a plugin was destroyed the status is `registered` again.

#### `each(name, event[, arg1, arg2, ...][[, strategy], callback])`
Requires the plugins matching the given name and emits an event with optional arguments on them.

If a callback is provided, it will be invoked with `(err, result)` once all emit calls returned. The result depends on the strategy as described in the hub.js documentation. The default is LAST.

Note that a callback must be provided when passing a strategy function or the strategy would be used as the callback.

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
