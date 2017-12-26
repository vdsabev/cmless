module.exports = (options = {}) => {
  const webpack = require('webpack');
  const config = require('./config');
  const cmless = config(options);
  const compiler = webpack(cmless);

  compiler.run(() => {}); // Empty function to fix `TypeError: callback is not a function`
};
