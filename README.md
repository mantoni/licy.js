# licy.js

[![Build Status]](https://travis-ci.org/mantoni/licy.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/licy.js/blob/master/LICENSE)

Module lifecycle management for Node and the browser.

## Install on Node

    npm install licy

## Browser support

Use [Browserify][] to create a standalone file.

## Features

- Guaranteed destruction of sub components
- Intercept function calls with filters
- Defer function calls until constructor invokes callback
- Receive notifications if new instances are created

## Usage

```js
var licy = require('licy');

var Foo = licy.define(function () {

  return {
    bar: function () {
      // ...
    }
  };
});

var foo = new Foo();
foo.bar();
```

## API

Licy is a [hub.js][] instance with these additions:

- `Licy`: The `Licy` constructor (`licy instanceof licy.Licy` is `true`)
- `define([definition])`: Defines a new type. The `definition` must be either
  ommitted, of type `function` or an `object`:
    - No `definition`: A plain licy type is returned that creates objects with
      the same API as the parent object.
    - `function`: The function is used as the constructor and is expected to
      return the API as an object.
    - `object`: Defines the API directly. A `constructor` can be defined
      optionally.
  The returned type creates new licy instances. Each instance is derived from
  licy itself and also inherits the [hub.js][] API.
- `create([definition])`: Is a convenience function to define and create an
  instance in one call. The `definition` may also be a licy type in which case
  a new instance of the type is returned.
- `destroy([callback])`: Emits the `destroy` event on the licy instance and all
  children. If a callback is given, it is invoked after this instance and all
  children are destroyed. If an error occurred, it is passed as the only
  argument to the callback.

## Events

The `prototype` of custom defined types is a licy instance itself. It can be
used to emit and subscribe global type specific events. These events are always
emitted:

- `create(instance, callback)`: When a new instance is created.
- `destroy(instance, callback)`: (TODO) When an instance is destroyed.

Each type instance and the root licy object emit these events:

- `define(type, callback)`: When a new child type is defined.
- `create(instance, type, callback)`: When a child instance is created.
- `destroy(callback)`: When the instance is destroyed.

[Build Status]: http://img.shields.io/travis/mantoni/licy.js.svg
[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/licy.svg
[Browserify]: http://browserify.org
[hub.js]: http://github.com/mantoni/hub.js
[EventEmitter]: http://nodejs.org/api/events.html
[filter chains]: https://github.com/mantoni/glob-filter.js
[async-glob-events]: https://github.com/mantoni/async-glob-events.js
[glob-filter]: https://github.com/mantoni/glob-filter.js
