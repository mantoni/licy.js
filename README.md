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

- `define`
- `create`


[Build Status]: http://img.shields.io/travis/mantoni/licy.js.svg
[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/licy.svg
[Browserify]: http://browserify.org
[hub.js]: http://github.com/mantoni/hub.js
[EventEmitter]: http://nodejs.org/api/events.html
[filter chains]: https://github.com/mantoni/glob-filter.js
[async-glob-events]: https://github.com/mantoni/async-glob-events.js
[glob-filter]: https://github.com/mantoni/glob-filter.js
