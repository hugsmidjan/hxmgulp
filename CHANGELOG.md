# Change Log

## Upcoming...

<!-- Add new lines here. Version number will be decided later -->

- ...

## 2.0.0

_2018-12-05_

- [BREAKING] feat: Upgrade `gulp-nunjucks-render` to work with Node 10  
  (See the [Nujucks 3 upgrade guide](docs/nujucks-3-upgrade.md))
- [BREAKING] feat: Remove `utils/styl` in favour of projects using
  [`stylutils`](https://github.com/hugsmidjan/stylutils)
- docs: Add CHANGELOG.md

## 1.7.1

_2018-12-05_

- fix: Revert breakage in Nunjucks paths for nested skins

## 1.7.0

_2018-11-29_

- feat: Speed-up startup - by only requiring plugins as needed

## 1.6.0

_2018-11-27_

(This version works with Node 10, except for the Nunjucks templates.)

- feat: upgrade autoprefixer and change minify-css to clean-css to support
  node ^10
- fix: make sure we don't load unsecure event-stream v3.3.6
  (see github security alerts)

## 1.5.3

_2018-11-22_

- fix: Add missing helpers.js

## 1.5.2

_2018-11-22_

- refactor: Encapsulate stylutils sources to discourage their use through
  `hxmgulp/utils/styl`

## 1.5.1

_2018-11-20_

- refactor: Use [`stylutils`](https://github.com/hugsmidjan/stylutils) as
  source for "[utils/styl](utils/styl)"

## 1.5.0

_2018-11-19_

- feat: Remove support for the `test:*` tasks.  
  (While technically a breaking change, they were approx. never used in the
  wild. If needed projects can be pinned to a version before 1.5.0)

## 1.4.0

_2018-11-13_

- feat: Strip '---ids' suffix off minified .svg files
- feat: Add option to keep SVG `id=""` attribute values.

## 1.3.1

_2018-11-12_

- fix: Make `_triangleShape()` auto center-align the triangle _(utils/styl)_

## 1.3.0

_2018-11-09_

- feat: Add `_extendSides()` mixin _(utils/styl)_
- fix: Drop bare 0 values fed into `csscalc()` _(utils/styl)_

## 1.2.0

_2018-09-27_

- feat: Make minified files strip out `NODE_ENV = "production"`

## 1.1.1

_2018-07-31_

- feat: Make `_triangleShape()` mixin more useful standalone _(utils/styl)_
- feat: add `_encodeURIComponent` and `_decodeURIComponent` functions _(utils/styl)_
- fix: Update scripts task to correctly handle non-mutating streams
- fix: Chrome is now giving all buttons border-radius _(utils/styl)_

## 1.1.0

_2017-08-29_

- feat: Whitelist `jq` and `qj` modules for es6 transpilation

## Older changes

- Lost in the mists of time...
