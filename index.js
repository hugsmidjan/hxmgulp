/* global process, console */
module.exports = function (gulp, skin) {
  skin = skin || {};
  skin.cssProc = /^(?:less|scss)$/.test(skin.cssProc) ? skin.cssProc : 'styl';

  if ( skin.js_suffixSource === undefined ) {
    skin.js_suffixSource = '-source';
  }

  var plugins = gulp._plugins = {};
  var tasks = gulp._tasks = {};

  var projectRoot = process.cwd();
  var pkg = require( projectRoot + '/package.json');

  var fs = require('fs');
  var path = require('path');

  var plumber = plugins.plumber = require('gulp-plumber');
  var filter = plugins.filter = require('gulp-filter');
  var changed = plugins.changed = require('gulp-changed');
  var replace = plugins.replace = require('gulp-replace');
  var header = plugins.header = require('gulp-header');
  var rename = plugins.rename = require('gulp-rename');
  var foreach = plugins.foreach = require('gulp-foreach');

  var isLESS =   skin.cssProc==='less';
  var isSCSS =   skin.cssProc==='scss';
  var isStylus = !isLESS && !isSCSS;
  var less =   isLESS   &&  (plugins.less = require('gulp-less'));
  var scss =   isSCSS   &&  (plugins.scss = require('gulp-ruby-sass'));
  var stylus = isStylus &&  (plugins.stylus = require('gulp-stylus'));

  var autoprefixer = plugins.autoprefixer = require('gulp-autoprefixer');
  var datauri = plugins.datauri = require('gulp-base64');
  var minifycss = plugins.minifycss = require('gulp-minify-css');

  var imagemin = plugins.imagemin = require('gulp-imagemin');
  var pngquant = plugins.pngquant = require('imagemin-pngquant');
  var mozjpeg = plugins.mozjpeg = require('imagemin-mozjpeg');
  var iconfont = plugins.iconfont = require('gulp-iconfont');

  var es2015 = require('babel-preset-es2015');
  var reactPreset = require('babel-preset-react');
  var babelify = require('babelify');
  var browserify = plugins.browserify = require('browserify');
  var through2 = plugins.through2 = require('through2');
  var uglify = plugins.uglify = require('gulp-uglify');

  var clone = plugins.clone = require('gulp-clone');
  var es = plugins.es = require('event-stream');

  var nunjucksRender = plugins.nunjucksRender = require('gulp-nunjucks-render');


  var runSequence = plugins.runSequence = require('run-sequence').use(gulp);
  var notifier = require('node-notifier');

  var browserifyfy = function (moduleInfo) {
          // About this: https://medium.com/@sogko/gulp-browserify-the-gulp-y-way-bb359b3f9623
          return through2.obj(function (file, enc, next) {
              var b;
              if ( skin.browserify ) {
                b = skin.browserify( file.path, moduleInfo, browserify );
              }
              else {
                var opts = Object.create(skin.browserifyOpts||{});
                opts.entries = [file.path];
                b = browserify( opts );
              }
              b.transform(babelify, {
                presets: [es2015, reactPreset],
                // HACK WARNING:
                // ------------------------------------------------------------------
                // babelify does not transpile non-local (i.e. npm installed) modules.
                // The `global` + `only` options let us over-ride that
                // by enumerating the npm packages that should be es6 transpiled. (See: https://stackoverflow.com/a/39349302)
                // For the time being let's just hard-code white-listing for `jq` and `qj`.
                // (The proper solution is to switch to rollup + bublé which
                // resolve this automatically via the package.json fields `module`/`jsnext:main`.)
                global: true,
                only: /^(?:.*\/node_modules\/(?:jq\/req|qj)\/|(?!.*\/node_modules\/)).*$/,
              }).bundle(function (err, res) {
                  err  &&  console.info(err);
                  file.contents = res;
                  next(null, file);
                });
            });
        };

  var notifyError = function (err) {
          var errmsg = err.message||err;
          notifier.notify({
            'title': 'Error',
            'message': errmsg,
          });
          console.info(errmsg);
      };

  // =========================================================================


  var nowYear = new Date().getFullYear();
  var copyrightBanner = 'Copyright ' +
                        (skin.copyrightYear ?
                            skin.copyrightYear + (nowYear>skin.copyrightYear?'-'+nowYear:''):
                            nowYear) +
                        ' ' +
                        (skin.copyrightInfo||(pkg.author.name ?
                            pkg.author.name + (pkg.author.url ? ' ('+pkg.author.url+')':'') + (pkg.author.email ? ' <'+pkg.author.email+'>':''):
                            pkg.author)) +
                        '\n';

  var buildTasks =    [];
  var watchTasks =    [];
  var htmltestTasks = [];
  var nunjucksWorkingDirs = [];

  var cssGlob = '*.'+skin.cssProc;
  var skinModules = skin.modules || ['/'];
  var skinSrc = (skin.src || '_src').replace(/\/+$/,'');
  var skinDist = (skin.dist || '.').replace(/\/+$/,'');
  var imgFolder = 'i/';

  var resolveModulePath = function (basePath, modulePath) {
          modulePath = path.relative( basePath, basePath+'/'+modulePath ) + '/';
          modulePath = path.normalize( modulePath )
                          .replace(/\\/g, '/');
          return (modulePath==='/' ? '' : '/') + modulePath;
        };
  var normalizeModule = function (module) {
          module =  typeof module === 'string' ?
                            { src: module }:
                            module;
          module.src = module.src ?
                                resolveModulePath( skinSrc, module.src ):
                                null;
          if ( !module.src ) {
            throw new Error( '`module.src` is undefined ( '+JSON.stringify(module)+' )' );
          }
          module.dist = module.dist ?
                                resolveModulePath( skinDist, module.dist ):
                                module.src;

          // Set feature flags:
          var featureFlags = ['do_css','do_scripts','do_images','do_iconfont','do_htmltests','do_htmltestsscripts'];
          var defaultDoValue = (module.$minimal != null) ? !module.$minimal : !skin.$minimal;
          featureFlags.forEach(function ( do_xxx ) {
              var doValue = (module[do_xxx] != null) ? module[do_xxx] : skin[do_xxx];
              module[do_xxx] = doValue != null ? doValue : defaultDoValue;
            });

          return module;
        };


  skinModules.forEach(function (module, folderIndex) {

      module = normalizeModule(module);
      var srcPath = skinSrc + module.src;
      var paths = {
              src:          srcPath,
              dist:         skinDist + module.dist,

              css:          srcPath + '',
              css_incl:     isSCSS ? '_scss/' : isLESS ? '_less/' : '_styl/',
              scripts:      srcPath + '',
              scripts_incl: '_js/',
              images:       srcPath + imgFolder,
              iconfont:     srcPath + 'iconfont/',
              htmltests:    srcPath + '_tests/',
            };
      var ns = module.src;
      var basePathCfg = { base:paths.src };
      var moduleInfo = {
              name:   ns,
              paths:  paths,
              basePathCfg: Object.create(basePathCfg),
              module: module,
            };

      require('mkdirp').sync( paths.dist );

      // ==============================================

      if ( module.do_iconfont ) {
        tasks[ns+'iconfont'] = function () {
            return gulp.src([
                paths.iconfont + '**/*.svg',
                '!' + paths.iconfont + '_raw/**',
              ], basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe( iconfont({
                    fontName:   'icons',
                    formats: ['woff2','woff','ttf','eot','svg'],
                    normalize:  true,
                    fontHeight: 1000,
                    timestamp: 1,
                  }) )
                .on('glyphs', function (glyphs/*, options*/) {
                    var iconData = {};
                    var iconDataScss = [];
                    var iconVars = [];
                    glyphs.forEach(function (cp) {
                        var name = cp.name;
                        var chr = cp.unicode[0];
                        iconData[name] = chr;
                        if ( isLESS || isSCSS ) {
                          var varPrefix = (isLESS?'@':'$') + 'icon-';
                          var chrCSS = '"' + chr + '"';
                          var padding = new Array(Math.max(20 - name.length,2)).join(' ');
                          iconVars.push( varPrefix + name + ':' + padding + chrCSS + ';\n' );
                          if ( isSCSS ) {
                            iconDataScss.push( '('+name+', '+chrCSS+')' );
                          }
                        }
                      });
                    if ( isLESS || isSCSS ) {
                      var code = '// This file is auto-generated. DO NOT EDIT! \n\n' +
                                iconVars.join('') + '\n' +
                                (isSCSS ? '$iconData:\n    '+iconDataScss.join(',\n    ')+';\n\n' : '');
                      fs.writeFileSync( paths.css + paths.css_incl + '_iconVars.'+skin.cssProc, code );
                    }
                    require('mkdirp').sync( paths.dist + imgFolder );
                    fs.writeFileSync( paths.dist + imgFolder + 'icons.json', JSON.stringify(iconData,null,'\t') );
                  })
                .pipe( gulp.dest( paths.dist + imgFolder ) );
          };
        gulp.task(ns+'iconfont', tasks[ns+'iconfont']);
        buildTasks.push( ns+'iconfont' );
      }


      if ( module.do_images ) {
        tasks[ns+'images'] = function () {
            return gulp.src([
                paths.images + '**/*',
                '!' + paths.images + '_raw/**',
              ], basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe( changed( paths.dist ) )
                .pipe( foreach(function (stream, file) {
                    var fileParams = file.path.match(/(---q(\d{1,3}(?:-\d{1,3})?)(?:--d(0))?)\.(png|jpe?g)$/i);
                    if ( fileParams ) {
                      if ( fileParams[4].toLowerCase()==='png' ) {
                        stream = stream.pipe( pngquant({
                            speed: 1, // default: `3`
                            quality: parseInt(fileParams[2],10),   // default `undefined` (i.e. 256 colors)
                            floyd: parseInt(fileParams[3],10)/100,
                            nofs: fileParams[3]==='0',
                          })() );
                      }
                      else {
                        stream = stream.pipe( mozjpeg({
                            quality: fileParams[2],
                          })() );
                      }
                      return stream.pipe( rename(function (path) {
                          path.basename = path.basename.slice(0, -fileParams[1].length);
                        }) );
                    }
                    else {
                      return stream.pipe( imagemin({
                          optimizationLevel: 4, // png
                          progressive: true, // jpg
                          interlaced: true, // gif
                          multipass: true, // svg
                        }) );
                    }
                  }) )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'images', tasks[ns+'images']);
        buildTasks.push( ns+'images' );
      }

      var iconfontDependency = module.do_iconfont ? [ns+'iconfont'] : [];

      if ( module.do_scripts ) {
        tasks[ns+'scripts'] = function () {
            var commonjsScripts = filter('**/*-common.js');
            var s1 = gulp.src([ paths.scripts+'*.js'], basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe( commonjsScripts )
                    .pipe( browserifyfy(moduleInfo) )
                    .pipe( rename(function (path) { path.basename = path.basename.replace(/-common$/, '');  }) )
                .pipe( commonjsScripts.restore() );
            var s2 = s1.pipe( clone() );

            if ( skin.js_suffixSource ) {
              s1 = s1.pipe( rename({ suffix:skin.js_suffixSource }) );
            }
            if ( skin.js_suffixMin ) {
              s2 = s2.pipe( rename({ suffix:skin.js_suffixMin }) );
            }
            s2 = s2
                .pipe( replace('process.env.NODE_ENV', '"production"') )
                .pipe( uglify({ preserveComments:'some', compress:{drop_console:true, global_defs:{ UGL1FY:true }} }) )
                .pipe( header('// '+copyrightBanner) );

            return es.merge(s1, s2)
                .pipe( gulp.dest( paths.dist ) );

          };
        gulp.task(ns+'scripts', tasks[ns+'scripts']);
        gulp.task(ns+'scripts--initial', iconfontDependency, tasks[ns+'scripts']);
        buildTasks.push( ns+'scripts--initial' );
      }


      if ( module.do_css ) {
        tasks[ns+'css'] = function () {
            return gulp.src( paths.css+cssGlob, basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe(
                    isSCSS ?
                        scss({
                            precision:7,
                            'sourcemap=none':true, // dodgy temporary workaround
                            // sourcemap:'none',
                            container:'gulp-ruby-sass-'+folderIndex, // Workaround for https://github.com/sindresorhus/gulp-ruby-sass/issues/124#issuecomment-54682317
                          }):
                    isLESS ?
                        less(/*{ strictMath: true }*/):
                    // Default:
                        stylus({
                            // linenos: true,
                            // use: [require(nib)],
                          })
                 )
                .pipe( autoprefixer({ browsers:skin.cssBrowserSupport||['> 0.5%', 'last 2 versions', 'Firefox ESR', 'iOS >= 8', 'Android >= 4.4'] }) )
                .pipe( minifycss({
                    // roundingPrecision: 2, // precision for px values
                    // aggressiveMerging:true, // set to false to disable aggressive merging of properties
                    advanced:false, // turn off advanced/aggressive merging. It's too buggy still. Ack!
                    processImport:false, // We want stylus to do that for us.
                    keepBreaks:true,
                    compatibility:'ie8',
                  }) )
                .pipe( replace(/ -no-merge/g,'') )
                // Crude trimming of decimal em, rem, % values
                // Temporary Hack - until either of these two feature-requests has been resolved:
                //   * https://github.com/jakubpawlowicz/clean-css/issues/686
                //   * https://github.com/stylus/stylus/issues/2024
                .pipe( replace( new RegExp('(\\.\\d{'+(skin.cssFloatPrecision||6)+'})\\d+((?:e[xm]|rem|%|pt|v(?:w|h|min|max))[;}\\),\\s])','g') ,'$1$2') )
                .pipe( datauri({
                    baseDir: paths.dist,
                    extensions: [ (/#datauri$/) ],
                    // maxImageSize: bytes,
                    // debug: true,
                  }) )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'css', tasks[ns+'css']);
        gulp.task(ns+'css--initial', iconfontDependency, tasks[ns+'css']);
        buildTasks.push( ns+'css--initial' );
      }


      if ( module.do_htmltests ) {
        nunjucksWorkingDirs.push( paths.htmltests );
        tasks[ns+'htmltests-html'] = function () {
            var nonHTMLFiles = filter('**/*.*.html'); // <-- because nunjucksRender renames all files to .html
            var testsFolder = paths.htmltests.substr(paths.src.length);
            var file;
            var icons;
            if ( module.do_iconfont ) {
              try { file = fs.readFileSync( paths.dist + imgFolder + 'icons.json' ); }
              catch (e) {}
              icons = JSON.parse( file || '{}' );
            }
            return gulp.src([
                paths.htmltests+'**/*.htm',
                '!'+paths.htmltests+'{incl,media}/**',
              ], basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe( nunjucksRender( module.do_iconfont?{ icons:icons }:{} ) )
                .pipe( replace(/^[\s*\n]+/, '') ) // remove macro/config induced whitespace at start of file.
                .pipe( nonHTMLFiles )
                    .pipe( rename(function (path) {
                        path.extname = '';
                        path.dirname = path.dirname.substr(testsFolder.length);
                      }) )
                    .pipe( nonHTMLFiles.restore() )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'htmltests-html', tasks[ns+'htmltests-html']);
        gulp.task(ns+'htmltests-html--initial', iconfontDependency, tasks[ns+'htmltests-html']);
        htmltestTasks.push( ns+'htmltests-html--initial' );

        tasks[ns+'htmltests-images'] = function () {
            return gulp.src( paths.htmltests+'media/**/*.*', basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                .pipe( changed( paths.dist ) )
                    .pipe( imagemin() )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'htmltests-images', tasks[ns+'htmltests-images']);
        htmltestTasks.push( ns+'htmltests-images' );


        if ( module.do_htmltestsscripts ) {
          tasks[ns+'htmltests-scripts'] = function () {
              var commonjsScripts = filter('**/*-common.js');
              return gulp.src([
                  paths.htmltests+'**/*.js',
                  '!'+paths.htmltests+'_js/**',
                ], basePathCfg )
                .pipe( plumber(function (err) { notifyError(err); }) )
                  .pipe( commonjsScripts )
                      .pipe( browserifyfy(moduleInfo) )
                      .pipe( rename(function (path) { path.basename = path.basename.replace(/-common$/, '');  }) )
                      .pipe( commonjsScripts.restore() )
                  .pipe( gulp.dest( paths.dist ) );
            };
          gulp.task(ns+'htmltests-scripts', tasks[ns+'htmltests-scripts']);
          gulp.task(ns+'htmltests-scripts--initial', iconfontDependency, tasks[ns+'htmltests-scripts']);
          buildTasks.push( ns+'htmltests-scripts--initial');
        }
      }



      var buildWatchGlobs = function (workPath, glob, inclGlob) {
              var globs = [workPath + glob];
              var relativePath = path.relative( paths.src , workPath );
              inclGlob =  relativePath ?
                              relativePath + '/' + inclGlob:
                              inclGlob;
              var folder = paths.src;
              while ( folder ) {
                globs.push( folder + inclGlob );
                folder = folder.replace(/[^/]+\/$/,'');
              }
              return globs;
            };

      gulp.task(ns+'watch', function () {
          module.do_css &&
              gulp.watch(buildWatchGlobs(paths.css, cssGlob, paths.css_incl+'**/'+cssGlob),   [ns+'css']);
          module.do_scripts &&
              gulp.watch(buildWatchGlobs(paths.scripts,'*.js', paths.scripts_incl+'**/*.js'), [ns+'scripts']);
          module.do_images &&
              gulp.watch([ paths.images+'**/*', '!'+paths.images+'_raw/**'],  [ns+'images']);

          if ( module.do_htmltests ) {
            gulp.watch([ paths.htmltests+'**/*.htm'],     [ns+'htmltests-html']);
            gulp.watch([ paths.htmltests+'media/**/*'],   [ns+'htmltests-images']);
            module.do_htmltestsscripts &&
                gulp.watch([ paths.htmltests+'**/*.js'],  [ns+'htmltests-scripts']);
          }

          if ( module.do_iconfont ) {
            gulp.watch([ paths.iconfont+'**/*', '!'+paths.iconfont+'_raw/**/*'],  [ns+'iconfont']);

            var iconsJsonTasks = [];
            module.do_css && iconsJsonTasks.push(ns+'css');
            module.do_htmltests && iconsJsonTasks.push(ns+'htmltests-html');
            iconsJsonTasks.length &&
                gulp.watch([ paths.dist+'i/icons.json'],  iconsJsonTasks);
          }
        });
      watchTasks.push(ns+'watch');


      // allow skinfile.js to define its own tasks
      if ( typeof skin.tasks === 'function' ) {
        var customTasks = skin.tasks(moduleInfo, gulp);
        if ( customTasks ) {
          if ( customTasks instanceof Array ) {
            customTasks = { build:customTasks };
          }
          buildTasks.push.apply(buildTasks, customTasks.build||[]);
          watchTasks.push.apply(watchTasks, customTasks.watch||[]);
        }
      }

    });


  gulp.task('test:karma', function (done) {
      require('karma').server.start({ // Run test once and exit
          configFile: projectRoot+'/karma.conf.js',
          singleRun: true,
        }, done);
    });
  gulp.task('test:karma:watch', function (done) {
      require('karma').server.start({ // Watch for file changes and re-run tests on each change
          configFile: projectRoot+'/karma.conf.js',
        }, done);
    });
  gulp.task('test:nightwatch', function (done) {
      require('nightwatch/bin/runner.js');
      done();
    });


  nunjucksRender.nunjucks.configure(nunjucksWorkingDirs);


  gulp.task('htmltests', htmltestTasks);
  buildTasks.unshift('htmltests');
  gulp.task('build', buildTasks);
  gulp.task('watch', watchTasks);

  gulp.task('default', ['build'], function (callback) {
        // // Example usage:
        // runSequence(
        //     'build-clean', // run  this first
        //     ['build-scripts', 'build-styles'], // then run these two in parallel
        //     'build-html', // finally run this one
        //     callback // signal end!
        //   );
        runSequence('watch', callback);
      });

};
