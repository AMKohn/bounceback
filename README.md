# Bounceback.js [![Build Status][travis-image]][travis-url] [![Test Coverage][coveralls-image]][coveralls-url] [![MIT License][license-image]][license-url] [![devDependency Status][devdep-image]][devdep-url]

### Fast, dependency free exit intent detection

Bounceback provides a simple one-event system that allows you to detect just before a visitor bounces from your site.  It works in a fashion similar to the commercial products available, except of course it's open source and doesn't cost $4,000/month.

If you prefer a less hands-on product I'd be more than happy to accept the $4,000 and take care of everything for you.


## Features

 - Size: Bounceback is only 1.2 KB
 - 100% test coverage
 - Backwards compatible to IE6
 - Complete mobile support
 - No dependencies, shims or polyfills


## Usage

```html
<script src="bounceback.js"></script>
```

```js
Bounceback.init([options])

Bounceback.init({
  onBounce: function() {
    // Your modal display or similar code goes here
  }
})
```


## Options

#### maxDisplay

Default: `1`

The maximum number of times the dialog may be shown on a page, or 0 for unlimited.  Only applicable on desktop browsers.

#### distance

Default: `100`

The minimum distance in pixels from the top of the page to consider triggering for.

#### method

Default: `auto`

The bounce detection method.

*Options:*

   `auto`: Automatically picks a method based on the device type.  `mouse` is used for desktop browsers and `history` for mobile.

   `mouse`: This detects bounces based on the mouse's direction, velocity and distance from the top of the page.

   `history`: This method uses the HTML5 History APIs (or hashes when in an older browser) to duplicate the page in the history.  Then when the visitor clicks to go back Bounceback detects the navigation and shows the dialog.  This method is almost foolproof, but could annoy some users.  It works best for mobile browsers.

#### sensitivity

Default: `10`

The minimum distance the mouse has to have moved in the last 10 mouse events for onBounce to be triggered.

#### cookieLife

Default: `365`

The cookie (when localStorage isn't available) expiry age, in days.

#### scrollDelay

Default: `500`

The amount of time in milliseconds that bounce events should be ignored for after scrolling, or 0 to disable.

This is necessary for the case when a user is scrolling and their mouse overshoots the page.  As soon as scrolling stops a `mouseout` event is fired incorrectly triggering a bounce event.

Because of this Bounceback waits a small amount of time after the last scroll event before re-enabling bounce detection.

#### aggressive

Default: `false`

This controls whether or not the bounce dialog should be shown on every page view or only on the user's first.

#### storeName

Default: `bounceback-visited`

The name/key to store the localStorage item (or cookie) under.

#### onBounce

Default: `function() { return Bounceback; }`

The handler to call when a bounce has been detected.  This accepts no arguments since none are necessary.


## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

  While Bounceback has been tested in actual browsers the included tests create a stubbed environment that simulates modern, mobile, and older browsers for simplicity and speed.


### License

  [MIT](LICENSE)

  If you end up using Bounceback, shoot me a message, I'd love to see it in the wild!

[travis-url]: https://travis-ci.org/AMKohn/bounceback
[travis-image]: https://img.shields.io/travis/AMKohn/bounceback.svg?style=flat
[devdep-url]: https://david-dm.org/AMKohn/bounceback#info=devDependencies
[devdep-image]: https://david-dm.org/AMKohn/bounceback/dev-status.svg?style=flat
[coveralls-url]: https://coveralls.io/r/AMKohn/bounceback?branch=master
[coveralls-image]: https://img.shields.io/coveralls/AMKohn/bounceback.svg?style=flat
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE