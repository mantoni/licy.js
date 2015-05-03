# licy.js

[![Build Status]](https://travis-ci.org/mantoni/licy.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/licy.js/blob/master/LICENSE)

Objects with managed lifecycles for Node and the browser.

## Features

- Async creation: Function calls are automatically deferred until constructor
  invokes callback
- All function calls are observable and can be intercepted
- Create hierarchies of instances that get destroyed together

## How does it work?

Licy types can be defined in two ways. Using an object:

```js
var Hello = licy.define({
  constructor: function (name) {
    this.name = name;
  },
  log: function () {
    console.log('Hello ' + this.name);
  }
});
```

Or using a function:

```js
var Hello = licy.define(function (name) {
  return {
    log: function () {
      console.log('Hello ' + name);
    }
  };
});
```

Types that where defined with licy can be newed up like any other JavaScript
type. Both of the examples above can be used like this:

```js
var hello = new Hello('world');
hello.log(); // logs "Hello world"
```

### Async object creation

Any defined type can be changed to be created asynchronously:

```js
var Hello = licy.define(function (name, callback) {
  setTimeout(callback, 500);
  return { /* as above */ };
});

var hello = new Hello('world');
hello.log(); // logs "Hello world" after 500 milliseconds
```

All function calls will be implicitly deferred until the constructor invoked
the callback.

As a consequence, obtaining the return value of a function only works with
callbacks:

```js
var Hello = licy.define(function (name) {
  return {
    get: function () {
      return 'Hello ' + name;
    }
  };
});

var hello = new Hello('world');

console.log(hello.get()); // logs "Hello undefined"
hello.get(function (err, value) {
  console.log(value); // logs "Hello world"
});
```

Note that the callback follows the Node.js `(err, value)` convention.

### Observing and intercepting calls

Each licy instance inherits the [hub.js][] event emitter API and emits an event
for each function call:

```js
hello.on('log', function () {
  // Invoked on hello.log() calls
});
```

[Filters][filter] can be used to intercept calls:

```js
hello.addFilter('log', function (next) {
  // Defer all calls by 500 milliseconds:
  setTimeout(function () {
    next();
  }, 500);
});
```

### Destroying instances

Each licy instance has a `destroy([callback])` implementation which emits a
`"destroy"` event and invokes the defined `destroy` function, if given:

```js
var Hello = licy.define(function (name) {
  return {
    destroy: function () {
      console.log('Bye ' + name);
    }
  };
});

var hello = new Hello('world');

hello.destroy();
```

Calling `licy.destroy()` will destroy all existing licy instances. This can be
used to shut down an application cleanly, e.g. closing a server gracefully.

To bind the lifecycle of one object to another, invoke `a.destroyWith(b)`. Use
`create(definition)` to bind a child object to a parent: `var b = a.create(B)`.

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
