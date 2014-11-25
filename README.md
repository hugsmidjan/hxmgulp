# HxmGulp

Default gulp tasks for Hugsmiðjan's projects.

## Install:

    npm install gulp
    npm install git+https://stash.hugsmidjan.is/scm/~mar/hxmgulp.git

You can do this with the `--save-dev` option in your project's root folder - or in your home folder, or wherever you store your shared node modules.


--------------------------------------

## Usage:

In your project's skin folder create a `gulpfile.js` containing this command:

    var gulp = require('gulp');
    require('hxmgulp')(gulp, options);

then isolate all your HTML-demo, JavaScript and LESS/SCSS and image/icon source files inside the `_src/` subfolder, and start gulp.

    gulp

That's it!


### Skin Options (and their defaults):

The `options` support the following properties (and defaults):

* **`modules: ['/']`**   - array of (sub)folder names.
* **`src: '_src'`** - path to the root source folder.
* **`dist: '.'`** - path to the root distribution folder where the compiled/minified CSS and JS files are saved.
* **`cssProc: 'styl'`** - type of CSS preporcessor being used. Currently valid options are `'styl'`, `'scss'` and `'less'`
* **`task: null`** - optional function which then gets run once for each item in the modules array.
    * Example: <pre><code>tasks: function (data) {
&nbsp; &nbsp; // data.module ===  current module (i.e. (sub)folder)
&nbsp; &nbsp; // data.paths  ===  paths config for the current module
&nbsp; &nbsp; // data.basePathCfg === A good default options object for gulp.task
&nbsp; &nbsp; require('gulp').task('mytask', function(){ ... });
&nbsp; &nbsp; return ['mytask'];
&nbsp; }</code></pre>
* **`copyrightYear: (new Date()).getFullYear()`** - Starting year for the copyright clauses at the top of minified files.
* **`copyrightInfo: 'Hugsmiðjan ehf. (www.hugsmidjan.is)'`** - text that appears after "Copyright 20XX-20YY ..." in the copyright clause.


--------------------------------------

## Features

All operations are performed within the "sources-folder" defined by `options.src`.

All rendering/compilation/minification results are saved under `options.dist` - with path- and file-names preseerved from their "source" counterpart.

`options.modules` contains a list of folders (and subfolders, and sub-subfolders) that each should be searched for files and watched for file-changes. All `modules` behave the same.

(Turtles all the way down...)

### CSS files

Any `.styl` file placed _directly_ inside the source folder gets rendered to a (lightly) minified CSS file with the same name inside the `dist` folder.

`.styl` files within the `_styl/` folder are watched for changes and trigger rerendering of SCSS files both within this "module" and all "submodules"

(NOTE: if `options.cssProc` is set to `'less'` or `'scss'` then replace all the above instances of "styl" with "less" or "scss" respectively.)

#### CSS data URIs

any CSS `url()` that ends with `#datauri` is automatically resolved and base64 encoded as an inline data URI in the rendered CSS file. Example:

```css
.box { background-image: url(i/stripes.png#datauri); }
```

becomes:

```css
.box { background-image: url(data:image/png;base64,iVBORw...); }
```

### JavaScripts

Any `.js` file placed _directly_ inside the source folder gets rendered to a minified CSS file with the same name inside the `dist` folder. (An unminified version is also saved with the suffix `-source.js`.)

`.js` files within the `_js/` folder are watched for changes and trigger rerendering of JavaScript files both within this "module" and all "submodules".

All scripts are run through the [es6-transpiler][es6t] so using its subset of supported es6 features is allowed.

Additionally: Any JavaScript file with the suffix `-common.js` is passed through browserify. The `-common` suffix is then stripped off.
_(NOTE: this feature will become unneccessary when es6-transpiler starts supporting es6 modules.)_

[es6t]: https://github.com/termi/es6-transpiler

### HTML test pages

The `_tests/`  folder contains static `.htm` page templates using [nunjucks][1] syntax. Any subfolder structure is retained during rendering.

`*.htm` partials inside `_tests/incl/` are also watched and trigger rerendering of the page templates in the base `_tests/` folder.

Any files inside `_tests/media/` are copied over (and lightly minified).

All JavaScripts are copied over (unless they're in a folder called `_js`) and browserified if their filename end with `-common.js`.

NOTE: there's a special case for page-templates with filenames with double-extensions. Those files become rooted in the `options.dist` folder itself, and have their ".htm" extension chopped off. Example:

    _src/_tests/homepage.htm
    _src/_tests/section/page.htm     <-- note subfolder
    
    _src/_tests/foobar.jsp.htm       <-- note double extension
    _src/_tests/subfoo/baz.json.htm  <-- note subfolder

...get rendered as:

    ./_tests/homepage.html      <-- HTML demo/tests folder
    ./_tests/section/page.html  <-- note subfolder
    
    ./foobar.jsp                <-- options.dist root folder
    ./subfoo/baz.json           <-- subfolder preserved

[2]: http://mozilla.github.io/nunjucks/


### Icon fonts

Any SVG icons placed in `svg-font-icons`  automatically converted into a web-font (eot, ttf, woff, svg) with human-friendly filename-based Stylus (or SASS/LESS) variables to use when writing CSS.

The generated Stylus file is saved at `src/_styl/_iconVars.styl`. (or `src/_(scss|less)/_iconVars.(scss|less)`)

NOTE: SVG files inside the folder `src/iconfonts/_raw/` are ignored as alternative designs and raw-materials for properly normalized icons.

### Images

Files placed inside `i/` are automatically copied to the corresponding dist folder. JPG, GIF, SVG and PNG files are passed through a *lossless* minimizer to remove comments, color-profiles, thumbnails and other unwanted meta-data.

NOTE: Any images placed in the folder `i/_raw/` are ignored as raw-materials.


