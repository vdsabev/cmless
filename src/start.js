module.exports = (options = {}) => {
  const history = require('connect-history-api-fallback');
  const connect = require('koa-connect');
  const serve = require('webpack-serve');
  const cmless = require('./cmless')(options);
  const config = require('./config')(options);

  serve({
    config,
    port: cmless.port,
    add(app, middleware, options) {
      app.use(connect(history()));
    },
  });
};
