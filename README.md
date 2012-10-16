# licy.js

Asynchronous dependency and lifecycle management for Node and the browser.

[![Build Status](https://secure.travis-ci.org/mantoni/licy.js.png?branch=master)](http://travis-ci.org/mantoni/licy.js)

## Install on Node

```
npm install licy
```

## Download for browsers

Browser packages are here: https://github.com/mantoni/licy.js/downloads.

## Usage

```js
var licy = require('licy');

licy.plugin('hello', function () {
  return 'Oh, hi world!';
});

licy.start('hello', function (err, hello) {
  console.log(hello);
});
```

More examples can be found in the [examples directory](https://github.com/mantoni/licy.js/tree/master/examples).


## Concept

Licy does two things:

 - Dependency resolution
 - Lifecycle management

#### Dependency resolution

Licy acts as a wrapper around your modules. It resolves other configured plugins, but leaves the dependency injection to you.

Dependencies are resolved asynchronously, allowing multiple plugins to be started in parallel.
A plugins `start` function is executed after all required dependencies where successfully started.

Other plugins can be declared explicitly, or a group of plugins can be required by naming convention.

```js
licy.plugin('server.http', {
  dependencies : ['routers.**']
  // ...
}
```

#### Lifecycle management

The lifecycle of a plugin is very simple. It can be configured, started, stopped or destroyed.
This allows an application to start, stop, restart and destroy trees of plugins.

Plugins can be started, stopped and destroyed explicitly, or as a group:

```js
licy.start('server.*');
```

All configured plugins can be addressed by starting `**`.

#### Callbacks

The lifecycle functions may declare a `callback` parameter. This makes this part of the lifecycle asynchronous.
All depending plugins will have to wait until this callback is invoked.

Licy uses node style callbacks. So wherever a callback can be used, the parameter list is `(err, value)`.

## API

The `licy` object is a [hub.js](http://mantoni.github.com/hub.js/) instance with the following API on top:

#### `plugin(name, start)`
Registers a plugin with the given name and start function.

#### `plugin(name, config)`
Registers a plugin with the given name and plugin config. The config must at least have a `start` function.

A plugin config can have these properties:
 - `dependencies` An array of plugin names. May contain wildcards.
 - `start` A function called to start the plugin. All dependencies are available via `this.dependencies.<name>`. The start function may return the plugin instance.
 - `stop` A function called to stop the plugin. If `start` returned an instance it is available via `this.instance`.
 - `destroy` A function called to destroy the plugin. This may be used to release resources in your module.

The functions start, stop and destroy can be made asynchronous by declaring a callback argument. The operation is considered completed once that callback function is invoked.

#### `start(name[, callback])`
Starts the plugin with the given name. This will invoke the `start` function of the plugin.
The optional callback is invoked with `(err, instance)` where instance is the plugin instance. If `*` was used in the plugin name, this is an array of plugin instances.

#### `stop(name[, callback])`
Stop the plugin with the given name. This will invoke the `stop` function of the plugin.
The optional callback is invoked with `(err)`.

#### `destroy(name[, callback])`
Destroy the plugin with the given name. This will invoke the `destroy` function of the plugin. If the plugin is running, it will be stopped before calling `destroy`.

#### `require(name, callback)`
Requires a plugin. The callback is invoked with `(err, instance)` where instance is the plugin instance. If `*` was used in the plugin name, this is a hash of { name : plugin instance } pairs.
If the plugin is not running, it will be started.

#### `status(name)`
Returns the status of the given plugin. This can be one of `configured`, `starting`, `started`, `stopping`, `stopped`, `destroying` or `unknown`.
Once a plugin was destroyed the status is `unknown`.


## Hacking

If you'd like to hack licy.js here is how to get started:

 - `npm install` will setup everything you need.
 - `make` lints the code with JSLint and runs all unit tests.
 - Use can also `make lint` or `make test` individually.

Running the test cases in a browser instead of Node requires [nomo.js](https://github.com/mantoni/nomo.js).

 - Run `npm install -g nomo`
 - Run `nomo server` from within the project directory.
 - Open http://localhost:4444/test in your browser.

To build a browser package containing the merged / minified scripts run `make package`.
