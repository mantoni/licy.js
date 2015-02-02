# licy.js

[![Build Status]](https://travis-ci.org/mantoni/licy.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/licy.js/blob/master/LICENSE)

Object lifecycle management for Node and the browser.

## Features

- Async creation: Defer function calls until constructor invokes callback
- Events: Define types that automatically emit events for method calls
- Interceptors: Register filters for methods
- Cleanup: Destroy trees of instances

## Install with npm

    npm install licy

## Browser support

Use [Browserify][] to create a standalone file.

## Usage

```js
var licy = require('licy');

var Car = licy.define(function () {

  return {
    drive: function () {
      // ...
    }
  };
});

var car = new Car();
car.drive();
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
  The returned type creates new Licy instances. Each instance is derived from
  Licy itself and also inherits the [hub.js][] API.
- `extend(Super, definition)`: Defines a new type which is derived from the
  `Super` type. Instances of the new type are `instanceof Super`. If a
  constructor is given, or if `definition` is a function, the super constructor
  must be explicitly invoked with `Super.super_.call(this)`. If a method is
  defined that already exists in the super type, it is registered as a
  [filter][].
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
[filter]: https://github.com/mantoni/glob-filter.js
