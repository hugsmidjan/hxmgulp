var settings = require('hxmgulp/testing/nightwatch-conf.js')();

settings.src_folders = [ '_src/_js-tests-browser/spec/' ];

// // See example: ./node_modules/hxmgulp/testing/examples/nightwatch.globals.js
// settings.globals_path = '_src/_js-tests-browser/globals.js';

// settings.globals = {
//   retryAssertionTimeout: 2000,
//   waitForConditionPollInterval: xxx,
//   waitForConditionTimeout: 750
// };

module.exports = settings;