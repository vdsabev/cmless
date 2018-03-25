module.exports = (options = {}) => {
  const history = require('connect-history-api-fallback');
  const connect = require('koa-connect');
  const serve = require('webpack-serve');
  const cmless = require('./cmless')(options);
  const config = require('./config')(options);

  serve({
    config,
    port: cmless.port,
    // TODO: Enable hot reloading when this issue is resolved:
    // https://github.com/webpack-contrib/webpack-hot-client/issues/8
    hot: false,
    add(app, middleware, options) {
      app.use(connect(history()));
    },
    on: {
      listening() {
        console.log(`Webpack listening at http://localhost:${cmless.port}`);
      },
    },
  });
};
