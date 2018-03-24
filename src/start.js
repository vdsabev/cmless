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
    on: {
      listening() {
        console.log(`Webpack listening at http://localhost:${cmless.port}`);
      },
    },
  });

  // const webpack = require('webpack');
  // const WebpackDevServer = require('webpack-dev-server');

  // const config = require('./config');
  // const webpackConfig = config(options);

  // const { join } = require('path');
  // const { cmless } = require(join(process.cwd(), 'package.json'));

  // const devServerOptions = {
  //   historyApiFallback: true,
  //   hot: false,
  //   inline: true,
  //   host: 'localhost',
  //   port: 3000,
  //   stats: { colors: true },
  // };

  // WebpackDevServer.addDevServerEntrypoints(webpackConfig, devServerOptions);

  // const server = new WebpackDevServer(compiler, devServerOptions);

  // server.listen(devServerOptions.port, devServerOptions.host, (error) => {
  //   if (error) {
  //     console.error(error);
  //     process.exit(1);
  //   }

  //   console.log(`WebpackDevServer listening at http://${devServerOptions.host}:${devServerOptions.port}`);
  // });
};
