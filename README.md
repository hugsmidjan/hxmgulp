# HxmGulp

Default gulp tasks for Hugsmiðjan's projects.

## Install:

    npm install git+ssh://git@stash.hugsmidjan.is:7999/~mar/hxmgulp.git

You can do this with the `--save-dep` option in your project's root folder - or in your home folder, or wherever you store your shared node modules.


## Usage:

In your project's skin folder create a `gulpfile.js` containing this command:

    var gulp = require('gulp');
    require('hxmgulp')(gulp, options);

then isolate all your HTML-demo, JavaScript and LESS/SCSS and image/icon source files inside the `_src/` subfolder, and start gulp.

    gulp

That's it!


## Skin Options (and their defaults):

The `options` support the following properties (and defaults):

* `modules: ['/']` - array of (sub)folder names.
* `src: '_src'` - path to the root source folder.
* `dist: '.'` - path to the root distribution folder where the compiled/minified CSS and JS files are saved.
* `cssProc: 'scss'` - type of CSS preporcessor being used. Currently valid options are `'scss'` and `'less'`
* `task: null` - optional function which then gets run once for each item in the modules array.  
  Example:  
      tasks: function (data) {
           // data.module ===  current module (i.e. (sub)folder)
           // data.paths  ===  paths config for the current module
           // data.basePathCfg === A good default options object for `gulp.task`
           require('gulp').task('mytask', function(){ ... });
           return ['mytask'];
        }
* `copyrightYear: (new Date()).getFullYear()` - Starting year for the copyright clauses at the top of minified files.
* `copyrightInfo: 'Hugsmiðjan evhf. (www.hugsmidjan.is)'` - text that appears after "Copyright 20XX-20YY ..." in the copyright clause.


## Features

All operations are performed within the "sources-folder" defined by `options.src`.

All rendering/compilation/minification results are saved under `options.dist` - with path- and file-names preseerved from their "source" counterpart.

`options.modules` contains a list of folders (and subfolders, and sub-subfolders) that each should be searched for files and watched for file-changes. All `modules` behave the same.

(Turtles all the way down...)

### CSS files

(NOTE: if `options.cssProc` is set to `'less'` then replace all instances of "scss" with "less" below:)

Any `.scss` file placed _directly_ inside the source folder gets rendered to a (lightly) minified CSS file with the same name inside the `dist` folder.

`.scss` files within the `_scss/` folder are watched for changes and trigger rerendering of SCSS files both within this "module" and all "submodules"

### CSS data URIs

any CSS `url()` that ends with `#datauri` is automatically resolved and base64 encoded as an inline data URI in the rendered CSS file. Example:

    .box {
        background-image: url(i/stripes.png#datauri);
    }

becomes: 

    .box { background-image: url(data:image/png;base64,iVBORw...); }


### JavaScripts

Any `.js` file placed _directly_ inside the source folder gets rendered to a minified CSS file with the same name inside the `dist` folder. (An unminified version is also saved with the suffix `-source.js`.)

`.js` files within the `_js/` folder are watched for changes and trigger rerendering of JavaScript files both within this "module" and all "submodules".

Any JavaScript file with the suffix `-common.js` is passed through browserify. The `-common` suffix is then stripped off.

### HTML test pages

The `_tests/`  folder contains static `.htm` page templates using [nunjucks][1] syntax.

`*.htm` partials inside `_tests/incl/` are also watched and trigger rerendering of the page templates in the base `_tests/` folder.

Any files inside `_tests/media/` are copied over (and lightly minified).

Any JavaScripts is browserified and copied over (unless it's in a folder called `_js`).

NOTE: there's a special case for page-templates with filenames with double-extensions. Those files become rooted in the `options.dist` folder itself, and have their ".htm" extension chopped off. Example:

    _src/_tests/homepage.htm
    _src/_tests/foobar.jsp.htm  <-- note double extension
    _src/_tests/subfoo/baz.json.htm <-- note subfolder

...get rendered as:

    ./_tests/homepage.html  <-- HTML demo/tests folder
    ./foobar.jsp            <-- options.dist root folder
    ./subfoo/baz.json       <-- subfolder preserved

[2]: http://mozilla.github.io/nunjucks/


### Icon fonts

Any SVG icons placed in `svg-font-icons`  automatically converted into a web-font (eot, ttf, woff, svg) with human-friendly filename-based SASS/LESS variables to use when writing CSS.

The generated SASS file is saved at `src/_scss/_iconVars.scss`. (or `src/_less/_iconVars.less`)

NOTE: SVG files inside the folder `src/iconfonts/_raw/` are ignored as alternative designs and raw-materials for properly normalized icons.

### Images

Files placed inside `i/` are automatically copied to the corresponding dist folder. JPG, GIF, SVG and PNG files are passed through a *lossless* minimizer to remove comments, color-profiles, thumbnails and other unwanted meta-data.

NOTE: Any images placed in the folder `i/_raw/` are ignored as raw-materials.


