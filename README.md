# licy.js

Asynchronous lifecycle management for Node and the browser.

Repository: https://github.com/mantoni/licy.js

[![Build Status](https://secure.travis-ci.org/mantoni/licy.js.png?branch=master)](http://travis-ci.org/mantoni/licy.js)

## Install on Node

```
npm install licy
```

## Download for browsers

Browser packages are here: http://maxantoni.de/licy.js/.

## Features

- Simple lifecycles (starting / stopping things)
- Transparent restarts of individual plugins
- Communication between plugins is event driven and asynchronous
- Auto-start plugins as required
- Queue events until plugin startup has finished

## Usage

Examples can be found in the [examples directory](https://github.com/mantoni/licy.js/tree/master/examples).


## API

#### `licy`
Is a [hub.js](http://github.com/mantoni/hub.js) event emitter instance.

All communication between the plugins happens via the `licy` event emitter.

```js
licy.emit('foo.bar', 42, function (err, result) {
  // ...
});
```

Please refer to [the hub.js API documentation](https://github.com/mantoni/hub.js/wiki/Hub-API) for the full list of supported features.

#### `licy.plugin(name, start)`
Registers a plugin with the given name and start function.

The start function takes the arguments `(plugin[, callack])`. The `plugin` is a [hub.js view](https://github.com/mantoni/hub.js/wiki/Views) on the `licy` object, scoped to the name of the plugin.

If a callback is given, all events for this plugin will be queued until the callback was invoked. If the first argument to the callback is non-null, it is considered an error.

```js
licy.plugin('server', function (plugin) {
  plugin.on('listen', function (port) {
    // ...
  });
});
```

#### `licy.plugins(config)`
Registers multiple plugins. Supposed to be used with `require` to define plugins in their own modules and register them all in one go.

```js
licy.plugins({
  'server': require('./server'),
  'router': require('./router'),
  // ...
});
```

#### `licy.startAll([callback])`
Starts all registered plugins.

The optional callback receives an error as the only argument.

#### `licy.destroyAll([callback])`
Destroys all registered plugins.

The optional callback receives an error as the only argument.

#### `licy.start(name[, callback])`
Starts the plugin with the given name. This will invoke the plugins start function.

The optional callback receives an error as the only argument.

If an event is emitted on `licy` that starts with `name`, the plugin will be started automatically. All events are queued until the plugin is started.

#### `licy.destroy(name[, callback])`
Destroy the plugin with the given name. This will emit the `destroy` event on the plugin and remove all event handlers from it.

The optional callback receives an error as the only argument.

#### `licy.restart(name[, callback])`
Destroys and then starts the plugin with the given name. This will emit the `destroy` event on the plugin, remove all event handlers from it and then invoke the start function of the plugin again.

The optional callback receives an error as the only argument.

Any events that are emitted for this plugin during the restart will be queued until the restart was successful.

#### `licy.reset()`
Resets the `licy` singleton to the initial state. All listeners will be removed, all plugins unregistered and all states reset. This will not destroy the plugins or emit any events.

Use this in the `tearDown` function of your unit tests.


## Contributing

If you'd like to contribute to licy.js here is how to get started:

 - Fork the project on GitHub.
 - `npm install` will setup everything you need.
 - `make` lints the code with JSLint and runs all unit tests.
 - You can also `make lint` or `make test` individually.

Running the test cases in a browser requires [nomo.js](https://github.com/mantoni/nomo.js).

 - Run `npm install -g nomo`
 - Run `nomo server` from within the project directory.
 - Open http://localhost:4444/test in your browser.

To build a browser package containing the merged / minified scripts run `make package`.
