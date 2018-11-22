var helpersPlugin = function () {
  return function (style) {

    style.define('_encodeURIComponent', function (str) {
      return encodeURIComponent(str.val);
    });
    style.define('_decodeURIComponent', function (str) {
      return decodeURIComponent(str.val);
    });

  };
};

module.exports = helpersPlugin;
