/* global __dirname, process */
module.exports = function (/*opts*/) {
    return {
      //src_folders: ['_src/_js-tests-browser/spec/'],
      output_folder: false,
      output: true,
      custom_commands_path: '',
      custom_assertions_path: '',
      globals_path: '',


      selenium: {
        start_process: true,
        server_path: __dirname + '/../bin/selenium-server-standalone-2.46.0.jar',
        log_path: process.cwd(),
        host: '127.0.0.1',
        port: 4444,
        cli_args: {
          'webdriver.chrome.driver': __dirname + '/../node_modules/.bin/chromedriver'+(process.platform==='win32'?'.cmd':''),
          'webdriver.ie.driver': ''
        }
      },


      test_settings: {

        default: {
          launch_url: 'http://localhost',
          selenium_port: 4444,
          selenium_host: 'localhost',
          silent: true,

          globals: {
            // retryAssertionTimeout: 2000,
            // waitForConditionPollInterval: xxx,
            waitForConditionTimeout: 750,
          },
          screenshots: {
            enabled: false,
            path: 'selenium-screens/'
          },
          desiredCapabilities: {
            browserName: 'firefox',
            javascriptEnabled: true,
            acceptSslCerts: true
          }
        },

        firefox: {
          desiredCapabilities: {
            browserName: 'firefox',
          }
        },

        chrome: {
          desiredCapabilities: {
            browserName: 'chrome',
          }
        },

        phantomjs: {
          desiredCapabilities : {
            browserName : 'phantomjs',
            'phantomjs.binary.path' : __dirname + '/../node_modules/.bin/phantomjs'+(process.platform==='win32'?'.cmd':'')
          }
        }
      }

    };
  };