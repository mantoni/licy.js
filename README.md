# licy.js

[![Build Status]](https://travis-ci.org/mantoni/licy.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/licy.js/blob/master/LICENSE)

Objects with managed lifecycles for Node and the browser.

## Features

- Async creation: Function calls are automatically deferred until constructor
  invokes callback
- Interceptors: Register filters for any function call or event
- All function calls are observable and can be intercepted
- Create trees of instances that get destroyed together

## Install with npm

    npm install licy --save

## Browser support

Use [Browserify][] to create a standalone file. The licy test suite passes on
IE 9, 10, 11, Chrome \*, Filefox \* and PhantomJS.

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
  Licy itself and also inherits the [hub.js][] API. All created instances are
  destroyed when the defining instance is destroyed.
- `create([definition])`: Creates an instance that will be destroyed with this
  instance. If `definition` is not a type, `define(definition)` is called
  before creating an instance.
- `destroy([callback])`: Emits the `destroy` event on the licy instance and all
  children. If a callback is given, it is invoked after this instance and all
  children are destroyed. If an error occurred, it is passed as the only
  argument to the callback.
- `destroyWith(type)`: Destroy this instance when `type` is destroyed.
- `extend(Super, definition)`: Defines a new type which is derived from the
  `Super` type. Instances of the new type are `instanceof Super`. If a
  constructor is given, or if `definition` is a function, the super constructor
  must be explicitly invoked with `Super.super_.call(this)`. If a method is
  defined that already exists in the super type, it is registered as a
  [filter][].

## Type API

Each type returned by `licy.define()` is a Licy instance with these additions:

- `Type.extend(definition)`: Is a shortcut for `licy.extend(Type, definition)`.

## Events

Each type instance and the root licy object emit these events:

- `define(type, callback)`: When a new child type is defined.
- `create(instance, type, callback)`: When a child instance is created.
- `destroy(callback)`: When the instance is destroyed.

The `prototype` of custom defined types is a licy instance itself. It can be
used to emit and subscribe global type specific events. These events are always
emitted:

- `instance.create(instance, type, callback)`: When a new instance is created.
- `instance.destroy(instance, error, callback)`: When an instance is destroyed.
  If an error occurred during destruction, the Error is passed on as `error`.

## Development

- `npm install` to install the dev dependencies
- `npm test` to lint, run tests on Node and PhantomJS and check code coverage

## License

MIT

[Build Status]: http://img.shields.io/travis/mantoni/licy.js.svg
[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/licy.svg
[Browserify]: http://browserify.org
[hub.js]: http://github.com/mantoni/hub.js
[filter]: https://github.com/mantoni/glob-filter.js
