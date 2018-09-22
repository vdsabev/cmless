module.exports = (options = {}) => {
  const webpack = require('webpack');
  const config = require('./config')(options);

  const compiler = webpack(config);
  compiler.run((error, stats) => {
    // Logging and error handling. Source: https://webpack.js.org/api/node/#error-handling
    if (error) {
      console.error(error.stack || error);
      if (error.details) {
        console.error(error.details);
      }
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }
  });
};
