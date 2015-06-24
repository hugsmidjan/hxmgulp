module.exports = function(config) {

  var cfg = require('hxmgulp/testing/karma-conf.js')(config, {
          // spec globs get assigned to `cfg.files` and set up to be preprocessed by 'browserify'
          specs: [ '_src/_js-tests-unit/**/*.spec.js' ]
        });

  // Add prerequisite scripts - or additional specs...
  cfg.files.unshift(
      // 'dist/browser-compiled-script.js
    );

  // cfg.exclude = [];

  // // start these browsers
  // // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
  // cfg.browsers = ['PhantomJS']; // ['Chrome','PhantomJS'];

  config.set( cfg );

};
