module.exports = function (gulp, skin) {
    skin = skin || {};
    skin.cssProc = /^(?:less|scss)$/.test(skin.cssProc) ? skin.cssProc : 'styl';

    var plugins = gulp._plugins = {};
    var tasks = gulp._tasks = {};

    var pkg = require( process.cwd() + '/package.json');

    var fs = require('fs');
    var path = require('path');

    var plumber = plugins.plumber = require('gulp-plumber');
    var filter = plugins.filter = require('gulp-filter');
    var changed = plugins.changed = require('gulp-changed');
    var replace = plugins.replace = require('gulp-replace');
    var header = plugins.header = require('gulp-header');
    var rename = plugins.rename = require('gulp-rename');

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
    var iconfont = plugins.iconfont = require('gulp-iconfont');

    var es6transpiler = plugins.es6transpiler = require('gulp-es6-transpiler');
    var browserify = plugins.browserify = require('browserify');
    var vinyltransform = plugins.vinyltransform = require('vinyl-transform');
    var uglify = plugins.uglify = require('gulp-uglify');

    var clone = plugins.clone = require('gulp-clone');
    var es = plugins.es = require('event-stream');

    var nunjucksRender = plugins.nunjucksRender = require('gulp-nunjucks-render');



    var es6transpilerOpts = {
            //environments: ['browser', 'devel', 'node'], // 'devel' includes alert(), confirm(), etc. etc.
            // BAH, strict linting should happen elsewhere, if needed.
            disallowDuplicated: false,
            disallowUnknownReferences: false,
            // includePolyfills: true, // (defaults to false) insert polyfills in the output file. true - insert only the necessary polyfills. "full" - insert all available polyfills.
          };

    var browserifyfy = function (module) {
            // About this: https://medium.com/@sogko/gulp-browserify-the-gulp-y-way-bb359b3f9623
            return vinyltransform(function(filename) {
                var b;
                if ( skin.browserify ) {
                  b = skin.browserify( filename, module, browserify );
                }
                else {
                  var opts = Object.create(skin.browserifyOpts||{});
                  opts.entries = filename;
                  b = browserify( opts );
                }
                return b.bundle();
              });
          };

    // =========================================================================


    var nowYear = new Date().getFullYear();
    var copyrightBanner = 'Copyright ' +
                          (skin.copyrightYear||nowYear) + (2014<nowYear?'-'+nowYear:'') + ' ' +
                          (skin.copyrightInfo||(pkg.author.name+' ('+pkg.author.url+')')) + '\n';

    var buildTasks =    [];
    var watchTasks =    [];
    var htmltestTasks = [];
    var nunjucksWorkingDirs = [];

    var cssGlob = '*.'+skin.cssProc;
    var skinModules = skin.modules || ['/'];
    var skinSrc = (skin.src || '_src').replace(/\/+$/,'');
    var skinDist = (skin.dist || '.').replace(/\/+$/,'');


    skinModules.forEach(function (moduleName, folderIndex) {

        moduleName = ('/'+moduleName+'/').replace(/\/\/+/g, '/'); // normalize
        var ns = moduleName;
        var srcPath = skinSrc + moduleName;
        var paths = {
                src:          srcPath,
                dist:         skinDist + moduleName,

                css:         srcPath + '',
                css_incl:    isSCSS ? '_scss/' : isLESS ? '_less/' : '_styl/',
                scripts:      srcPath + '',
                scripts_incl: '_js/',
                images:       srcPath + 'i/',
                iconfont:     srcPath + 'iconfont/',
                htmltests:    srcPath + '_tests/',
              };
        var basePathCfg = { base:paths.src };
        var module = {
                name:   moduleName,
                paths:  paths,
                basePathCfg: Object.create(basePathCfg),
              };

        // ==============================================

        tasks[ns+'iconfont'] = function() {
            var iconFileOutPath = paths.dist + path.relative(paths.src,paths.images);
            var assgn = isStylus ? ' = ' : ':';
            var varPrefix = (isLESS?'@':'$') + 'icon-';
            return gulp.src([
                paths.iconfont + '**/*.svg',
                '!' + paths.iconfont + '_raw/**'
              ], basePathCfg )
                .pipe( plumber() )
                .pipe( iconfont({
                    fontName:   'icons',
                    normalize:  true
                  }) )
                .on('codepoints', function (codepoints/*, options*/) {
                    var iconData = isSCSS ? [] : {};
                    var iconVars = [];
                    codepoints.forEach(function (cp) {
                        var name = cp.name;
                        var chr = cp.codepoint.charAt ? cp.codepoint : String.fromCharCode(cp.codepoint);
                        var chrCSS = '"' + chr + '"';
                        var padding = new Array(Math.max(20 - name.length,2)).join(' ');
                        iconVars.push( varPrefix + name + assgn + padding + chrCSS + ';\n' );
                        isSCSS ?
                            iconData.push( '(' + name + ', ' + chrCSS + ')' ):
                            (iconData[name] = chr); // Stylus
                      });
                    var code = '// This file is auto-generated. DO NOT EDIT! \n\n' +
                                iconVars.join('') + '\n' +
                                (isSCSS ? '$iconData:\n    '+iconData.join(',\n    ')+';\n\n' : '') +
                                (isStylus ? '$iconData = ' + JSON.stringify(iconData,null,4) + ';\n\n' : '');
                    fs.writeFileSync( paths.css + paths.css_incl + '_iconVars.'+skin.cssProc, code );
                    fs.writeFileSync( iconFileOutPath+'/icons.json', JSON.stringify(iconData,null,'\t') );
                  })
                .pipe( gulp.dest( iconFileOutPath ) );
          };
        gulp.task(ns+'iconfont', tasks[ns+'iconfont']);
        buildTasks.push( ns+'iconfont' );


        tasks[ns+'images'] = function() {
            var imgFilter = filter('**/*.{png,gif,jpg,jpeg}');
            return gulp.src([
                paths.images + '**/*.*',
                '!' + paths.images + '_raw/**'
              ], basePathCfg )
                .pipe( plumber() )
                .pipe( changed( paths.dist ) )
                .pipe( imgFilter )
                    .pipe( imagemin() )
                    .pipe( imgFilter.restore() )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'images', tasks[ns+'images']);
        buildTasks.push( ns+'images' );


        tasks[ns+'scripts'] = function() {
            var commonjsScripts = filter('**/*-common.js');
            var s1 = gulp.src([ paths.scripts+'*.js'], basePathCfg )
                .pipe( plumber() )
                .pipe( commonjsScripts )
                    .pipe( browserifyfy(module) )
                    .pipe( rename(function(path){ path.basename = path.basename.replace(/-common$/, '');  }) )
                .pipe( commonjsScripts.restore() )
                .pipe( es6transpiler(es6transpilerOpts) );
            var s2 = s1.pipe( clone() );

            s1
                .pipe( rename({ suffix:'-source' }) );
            s2
                .pipe( uglify({ preserveComments:'some' }) )
                .pipe( header('// '+copyrightBanner) );

            return es.merge(s1, s2)
                .pipe( gulp.dest( paths.dist ) );

          };
        gulp.task(ns+'scripts', tasks[ns+'scripts']);
        gulp.task(ns+'scripts--initial', [ns+'iconfont'], tasks[ns+'scripts']);
        buildTasks.push( ns+'scripts--initial' );


        tasks[ns+'css'] = function() {
            return gulp.src( paths.css+cssGlob, basePathCfg )
                .pipe( plumber( isStylus ? function(err){ console.log(err.message); } : undefined ) )
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
                        stylus({
                            // linenos: true,
                            // use: [require(nib)],
                          })
                 )
                .pipe( autoprefixer({ browsers:['> 0.5%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'] }) )
                .pipe( minifycss({
                    // roundingPrecision: 2, // precision for px values
                    noAdvanced:true, // turn off advanced/aggressive merging. It's too buggy still. Ack!
                    keepBreaks:true,
                    compatibility:'ie8'
                  }) )
                .pipe( replace(/ -no-merge/g,'') )
                .pipe( datauri({
                    baseDir: paths.dist,
                    extensions: [ (/#datauri$/) ],
                    // maxImageSize: bytes,
                    // debug: true,
                  }) )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'css', tasks[ns+'css']);
        gulp.task(ns+'css--initial', [ns+'iconfont'], tasks[ns+'css']);
        buildTasks.push( ns+'css--initial' );


        nunjucksWorkingDirs.push( paths.htmltests );
        tasks[ns+'htmltests-html'] = function() {
            var nonHTMLFiles = filter('**/*.*.html'); // <-- because nunjucksRender renames all files to .html
            var testsFolder = paths.htmltests.substr(paths.src.length);
            return gulp.src([
                paths.htmltests+'**/*.htm',
                '!'+paths.htmltests+'{incl,media}/**'
              ], basePathCfg )
                .pipe( plumber() )
                .pipe( nunjucksRender() )
                .pipe( replace(/^[\s*\n]+/, '') ) // remove macro/config induced whitespace at start of file.
                .pipe( nonHTMLFiles )
                    .pipe( rename(function(path){
                        path.extname = '';
                        path.dirname = path.dirname.substr(testsFolder.length);
                      }) )
                    .pipe( nonHTMLFiles.restore() )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'htmltests-html', tasks[ns+'htmltests-html']);
        htmltestTasks.push( ns+'htmltests-html' );

        tasks[ns+'htmltests-images'] = function() {
            return gulp.src( paths.htmltests+'media/**/*.*', basePathCfg )
                .pipe( plumber() )
                .pipe( changed( paths.dist ) )
                    .pipe( imagemin() )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'htmltests-images', tasks[ns+'htmltests-images']);
        htmltestTasks.push( ns+'htmltests-images' );

        tasks[ns+'htmltests-scripts'] = function() {
            var commonjsScripts = filter('**/*-common.js');
            return gulp.src([
                paths.htmltests+'**/*.js',
                '!'+paths.htmltests+'_js/**'
              ], basePathCfg )
                .pipe( plumber() )
                .pipe( commonjsScripts )
                    .pipe( browserifyfy(module) )
                    .pipe( rename(function(path){ path.basename = path.basename.replace(/-common$/, '');  }) )
                    .pipe( commonjsScripts.restore() )
                .pipe( es6transpiler(es6transpilerOpts) )
                .pipe( gulp.dest( paths.dist ) );
          };
        gulp.task(ns+'htmltests-scripts', tasks[ns+'htmltests-scripts']);
        gulp.task(ns+'htmltests-scripts--initial', [ns+'iconfont'], tasks[ns+'htmltests-scripts']);
        buildTasks.push( ns+'htmltests-scripts--initial');



        var buildGlobs = function (workPath, glob, inclGlob) {
                var globs = [workPath + glob];
                var relativePath = path.relative( paths.src , workPath );
                inclGlob =  relativePath ?
                                relativePath + '/' + inclGlob:
                                inclGlob;
                var folder = paths.src;
                while ( folder )
                {
                  globs.push( folder + inclGlob );
                  folder = folder.replace(/[^\/]+\/$/,'');
                }
                return globs;
              };

        gulp.task(ns+'watch', function() {
            gulp.watch(buildGlobs(paths.css, cssGlob, paths.css_incl+'**/'+cssGlob),   [ns+'css']);
            gulp.watch(buildGlobs(paths.scripts,'*.js', paths.scripts_incl+'**/*.js'), [ns+'scripts']);
            gulp.watch([ paths.images+'**/*', '!'+paths.images+'_raw/**'],        [ns+'images']);
            gulp.watch([ paths.iconfont+'**/*', '!'+paths.iconfont+'_raw/**/*'],  [ns+'iconfont']);
            gulp.watch([ paths.htmltests+'**/*.htm'],                             [ns+'htmltests-html']);
            gulp.watch([ paths.htmltests+'media/**/*'],                           [ns+'htmltests-images']);
            gulp.watch([ paths.htmltests+'**/*.js'],                              [ns+'htmltests-scripts']);
          });
        watchTasks.push(ns+'watch');


        // allow skinfile.js to define its own tasks
        if ( typeof skin.tasks === 'function' )
        {
          var customTasks = skin.tasks(module);
          if ( customTasks )
          {
            if ( customTasks instanceof Array )
            {
              customTasks = { build:customTasks };
            }
            buildTasks.push.apply(buildTasks, customTasks.build||[]);
            watchTasks.push.apply(watchTasks, customTasks.watch||[]);
          }
        }

      });

    nunjucksRender.nunjucks.configure(nunjucksWorkingDirs);


    gulp.task('htmltests', htmltestTasks);
    buildTasks.unshift('htmltests');
    gulp.task('build', buildTasks);
    gulp.task('watch', watchTasks);

    gulp.task('default', ['build', 'watch']);

  };
