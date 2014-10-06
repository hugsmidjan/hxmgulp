module.exports = function (gulp, skin) {
    skin = skin || {};
    skin.cssProc = skin.cssProc || 'scss';

    var pkg = require('./package.json');

    var fs = require('fs');
    var path = require('path');
    var https = require('https');

    var plumber = require('gulp-plumber');
    var filter = require('gulp-filter');
    var changed = require('gulp-changed');
    var replace = require('gulp-replace');
    var header = require('gulp-header');
    var rename = require('gulp-rename');

    var isLESS = skin.cssProc==='less';
    var isSCSS = !isLESS;
    var less = isLESS && require('gulp-less');
    var scss = isSCSS && require('gulp-ruby-sass');

    var autoprefixer = require('gulp-autoprefixer');
    var datauri = require('gulp-base64');
    var minifycss = require('gulp-minify-css');

    var imagemin = require('gulp-imagemin');
    var iconfont = require('gulp-iconfont');

    var es6transpiler = require('gulp-es6-transpiler');
    var browserify = require('gulp-browserify');
    var uglify = require('gulp-uglify');

    var nunjucksRender = require('gulp-nunjucks-render');

    var es6transpilerOpts = {
            environments: ['node','browser','devel'], // 'devel' includes alert(), confirm(), etc. etc.
            // globals: { 'my':false, 'hat':true },
            // includePolyfills: true, // (defaults to false) insert polyfills in the output file. true - insert only the necessary polyfills. "full" - insert all available polyfills.
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

    if ( isSCSS )
    {
      // curl codecentre files...
      var ccFolder = '_src/_scss/_codecentre/';
      if ( !fs.existsSync(ccFolder) ){  fs.mkdirSync( ccFolder );  }
      ['utils.scss','eplica-utils.scss','normalize.scss']
          .forEach(function (fileName) {
              https.get('https://codecentre.eplica.is/themes/scss/'+fileName, function (res) {
                  res.pipe( fs.createWriteStream( ccFolder+fileName ) );
                });
            });
    }

    var cssGlob = '*.'+skin.cssProc;
    var skinModules = skin.modules || ['/'];
    var skinSrc = (skin.src || '_src').replace(/\/+$/,'');
    var skinDist = (skin.dist || '.').replace(/\/+$/,'');


    skinModules.forEach(function (module, folderIndex) {

        module = ('/'+module+'/').replace(/\/\/+/g, '/'); // normalize
        var srcPath = skinSrc + module;
        var paths = {
                src:          srcPath,
                dist:         skinDist + module,

                css:         srcPath + '',
                css_incl:    isSCSS ? '_scss/' : '_less/',
                scripts:      srcPath + '',
                scripts_incl: '_js/',
                images:       srcPath + 'i/',
                iconfont:     srcPath + 'iconfont/',
                htmltests:    srcPath + '_tests/',
              };

        var basePathCfg = { base:paths.src };
        var ns = module;

        // ==============================================

        buildTasks.push( ns+'iconfont' );
        gulp.task(ns+'iconfont', function() {
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
                    var iconData = [];
                    var iconVars = [];
                    codepoints.forEach(function (cp) {
                        var name = cp.name;
                        var chr = '"\\' + cp.codepoint.toString(16) + '"';
                        var padding = new Array(Math.max(20 - name.length,2)).join(' ');
                        iconVars.push( (isSCSS?'$':'@')+'icon-' + name + ':' + padding + chr + ';\n' );
                        isSCSS && iconData.push( '(' + name + ', ' + chr + ')' );
                      });
                    var code = '// This file is auto-generated. DO NOT EDIT! \n\n' +
                                iconVars.join('') + '\n' +
                                (isSCSS ? '$iconData:\n    '+iconData.join(',\n    ')+';\n\n' : '');
                    fs.writeFileSync( paths.css + paths.css_incl + '_iconVars.'+skin.cssProc, code );
                  })
                .pipe( gulp.dest( paths.dist + path.relative(paths.src,paths.images) ) );
          });


        buildTasks.push( ns+'images' );
        gulp.task(ns+'images', function() {
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
          });


        buildTasks.push( ns+'scripts' );
        gulp.task(ns+'scripts', function() {
            var commonjsScripts = filter('**/*-common.js');
            return gulp.src([ paths.scripts+'*.js'], basePathCfg )
                .pipe( plumber() )
                .pipe( commonjsScripts )
                    .pipe( browserify() )
                    .pipe( rename(function(path){ path.basename = path.basename.replace(/-common$/, '');  }) )
                    .pipe( commonjsScripts.restore() )
                .pipe( es6transpiler(es6transpilerOpts) )
                .pipe( rename({ suffix:'-source' }) )
                .pipe( gulp.dest( paths.dist ) )

                .pipe( uglify() )
                .pipe( header('// '+copyrightBanner) )
                .pipe( rename(function(path){ path.basename = path.basename.replace(/-source$/, '');  }) )
                .pipe( gulp.dest( paths.dist ) );
          });


        buildTasks.push( ns+'css' );
        gulp.task(ns+'css', function() {
            return gulp.src( paths.css+cssGlob, basePathCfg )
                .pipe( plumber() )
                .pipe( isSCSS ?
                    scss({
                        precision:7,
                        'sourcemap=none':true, // dodgy temporary workaround
                        // sourcemap:'none',
                        container:'gulp-ruby-sass-'+folderIndex, // Workaround for https://github.com/sindresorhus/gulp-ruby-sass/issues/124#issuecomment-54682317
                      }):
                    less(/*{ strictMath: true }*/)
                 )
                .pipe( autoprefixer('> 0.5%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'/*, { cascade: true }*/) )
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
          });



        htmltestTasks.push( ns+'htmltests-html' );
        nunjucksWorkingDirs.push( paths.htmltests );
        gulp.task(ns+'htmltests-html', function() {
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
          });
        htmltestTasks.push( ns+'htmltests-images' );
        gulp.task(ns+'htmltests-images', function() {
            return gulp.src( paths.htmltests+'media/**/*.*', basePathCfg )
                .pipe( plumber() )
                .pipe( changed( paths.dist ) )
                    .pipe( imagemin() )
                    .pipe( gulp.dest( paths.dist ) );
          });
        buildTasks.push( ns+'htmltests-scripts' );
        gulp.task(ns+'htmltests-scripts', function() {
            var commonjsScripts = filter('**/*-common.js');
            return gulp.src([
                paths.htmltests+'**/*.js',
                '!'+paths.htmltests+'_js/**'
              ], basePathCfg )
                .pipe( plumber() )
                .pipe( commonjsScripts )
                    .pipe( browserify() )
                    .pipe( rename(function(path){ path.basename = path.basename.replace(/-common$/, '');  }) )
                    .pipe( commonjsScripts.restore() )
                .pipe( es6transpiler(es6transpilerOpts) )
                .pipe( gulp.dest( paths.dist ) );
          });



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

        watchTasks.push(ns+'watch');
        gulp.task(ns+'watch', function() {
            gulp.watch(buildGlobs(paths.css, cssGlob, paths.css_incl+'**/'+cssGlob),   [ns+'css']);
            gulp.watch(buildGlobs(paths.scripts,'*.js', paths.scripts_incl+'**/*.js'), [ns+'scripts']);
            gulp.watch([ paths.images+'**/*', '!'+paths.images+'_raw/**'],        [ns+'images']);
            gulp.watch([ paths.iconfont+'**/*', '!'+paths.iconfont+'_raw/**/*'],  [ns+'iconfont']);
            gulp.watch([ paths.htmltests+'**/*.htm'],                             [ns+'htmltests-html']);
            gulp.watch([ paths.htmltests+'media/**/*'],                           [ns+'htmltests-images']);
            gulp.watch([ paths.htmltests+'**/*.js'],                              [ns+'htmltests-scripts']);
          });


        // allow skinfile.js to define its own tasks
        if ( typeof skin.tasks === 'function' )
        {
            var taskNames = skin.tasks({
                                module: module,
                                paths:  paths,
                                basePathCfg: Object.create(basePathCfg),
                              });
            if ( taskNames )
            {
                buildTasks.push.apply(buildTasks, taskNames);
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
