# HxmGulp

Default gulp tasks for Hugsmiðjan's projects.

## Install:

    npm install gulp
    npm install git+https://stash.hugsmidjan.is/scm/misc/hxmgulp.git

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

  * **`src: '_src'`** - path to the root source folder.

  * **`dist: '.'`** - path to the root distribution folder where the compiled/minified CSS and JS files are saved.

  * **`modules: ['/']`**   - Array of (sub)folder names (Strings) or `{src,dist}` objects.
    - `'foo/'` processes files within the folder `options.src + '/foo/'` and saves the output into `options.dist + '/foo/'`.
    - `{ src:'foo/', dist:'../bar/baz/'}` would however, save the output files into `options.dist + '/../bar/baz/'`.

  * **`cssProc: 'styl'`** - type of CSS preporcessor being used. Currently valid options are `'styl'`, `'scss'` and `'less'`

  * **`task: null`** - optional function which then gets run once for each item in the modules array. Example:
<pre><code>tasks: function (moduleInfo, gulp) {<br/>
&nbsp; &nbsp; // moduleInfo.name === the current module (i.e. (sub)folder)<br/>
&nbsp; &nbsp; // moduleInfo.paths === paths config for the current module<br/>
&nbsp; &nbsp; // moduleInfo.basePathCfg === A good default options object for gulp.task()<br/>
&nbsp; &nbsp; gulp.task('mytask', function(){ ... });<br/>
&nbsp; &nbsp; return { build:['mytask'], watch:null };<br/>
&nbsp; }</code></pre>

  * **`browserifyOpts: null`** - object with options for browserify

  * **`browserify: null`** - optional function to run (and configure) browserify.  Example: <pre><code data-language="js">browserify: function (filename, moduleInfo, browserify) {<br />
&nbsp; &nbsp; // moduleInfo.name === the current module (i.e. (sub)folder)<br />
&nbsp; &nbsp; // moduleInfo.paths === paths config for the current module<br />
&nbsp; &nbsp; // moduleInfo.basePathCfg === A good default options object for gulp.task()<br />
&nbsp; &nbsp; var b = browserify();<br />
&nbsp; &nbsp; b.require([{ file:'foobar.js', expose:'foobar' }]);<br />
&nbsp; &nbsp; b.external(['react']);<br />
&nbsp; &nbsp; return b;<br />
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

Any `.js` file placed _directly_ inside the source folder gets rendered to a minified JavaScript file with the same name inside the `dist` folder. (An unminified version is also saved with the suffix `-source.js`.)

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

Any SVG icons placed in `iconfonts`  automatically converted into a web-font (eot, ttf, woff, svg) with human-friendly filename-based JSON object saved in in `{options.dist}/i/icons.json` for quick import in Stylus using `json('../../dist/i/icons.json')`.

For projects using LESS (or SCSS) the variables are also written to the file `_less/_iconVars.less` (or `_scss/_iconVars.scss`).

NOTE: SVG files inside the folder `iconfonts/_raw/` are ignored as alternative designs and raw-materials for properly normalized icons.

### Images

Files placed inside `i/` are automatically copied to the corresponding dist folder. JPG, GIF, SVG and PNG files are passed through a *lossless* minimizer to remove comments, color-profiles, thumbnails and other unwanted meta-data.

PNG and JPEG images can be forced through a lossy compression via a `---q{N}` file-name suffix. The suffix is stripped from the filename before saving in the `dist` folder.

**Examples:**

  * `src/i/photo---q60.jpg` (100% quality original)  --->  `dist/i/photo.png` (recompressed to approx. 60% quality)
  * `src/i/image---q50.png` (24bit file)  --->  `dist/i/image.png` (png8 with at least 50% quality)
  * `src/i/image---q50-70.png` (24bit file)  --->  `dist/i/image.png` (png8 with between 50% and 70% quality)
  * `src/i/image---q50--d0.png` (24bit file)  --->  `dist/i/image.png` (png8 with at least 50% quality - no dithering)

NOTE: Any images placed in the folder `i/_raw/` are ignored as raw-materials.



### Unit Testing

You can write unit tests for your code using the [Jasmine](http://jasmine.github.io/2.3/introduction.html) unit testing library.
You can save your specs  where ever you like, but `_src/_js-tests-unit/*.spec.js` is a good default.

You must then place a `karma.config.js` ([example](testing/examples/karma.config.js)) file in your project root, and specify the file-globbing pattern(s) that matches your spec files, etc. etc.

To run the tests with [Karma](http://karma-runner.github.io/0.12/index.html) (an in-browser test runner) type in these commands:

```sh
gulp test:karma         ## run tests once
gulp test:karma:watch   ## run tests on file changes
```

Hxmgulp runs the tests using [PhantomJS](http://phantomjs.org/) browser-emulator, by default, but also provides an (optional) support for Google Chrome (provided you have it installed on your computer).

More browsers can be added on a per-project basis, and configured in your `karma.config.js`.


### Functional/Browser Testing

You can write functional/GUI/browser tests using [Nightwatch.js](http://nightwatchjs.org/api).
You can save your functional specs where ever you like, but `_src/_js-tests-browser/spec/*.js` is a good default.

You must then place a `nightwatch.config.js` ([example](testing/examples/nightwatch.config.js)) file in your project root, and specify the `src_folders` containing your spec files, etc. etc.

To run the tests type in these commands:

```sh
gulp test:nightwatch    ## Defaults to Firefox only
gulp test:nightwatch  --env firefox,chrome   ## multi-browser
```

Hxmgulp runs the tests using Firefox by default, but also provides an (optional) support for Google Chrome<!-- and [PhantomJS](http://phantomjs.org/) (experimental) -->.

More browsers can be added on a per-project basis, and configured in your `nightwatch.config.js`.

