# EplicaGulp

Default gulp tasks for Hugsmiðjan's projects.

## Install:

    npm install git+ssh://git@stash.hugsmidjan.is:7999/~mar/eplicagulp.git

## Usage:

In your project's skin folder create a `gulpfile.js` containing this command:

    require('eplicagulp')(options);

That's it.

### Options (and their defaults):

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


