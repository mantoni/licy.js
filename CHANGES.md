# Changes

## v0.9.0

- Licy is not a singleton anymore. Instead, a factory function is exposed that
  creates a new licy instance on each call.
- Removed `reset` since it's obsolete.

## v0.8.0

- Updated hub.js to 0.13.0
- Removed `options` and `Options`

## v0.7.0

- Updated hub.js to 0.12.0
- Using Browserify to create standalone browser module
- Run tests in Phantom.JS using Browserify and Phantomic
- Run tests in browsers with a standalone test HTML file generated with Consolify
