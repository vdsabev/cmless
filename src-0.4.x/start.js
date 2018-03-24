module.exports = (options = {}) => {
  const WebpackDevServer = require('webpack-dev-server');
  const config = require('./config');
  const webpackConfig = config(options);

  const { join } = require('path');
  const { cmless } = require(join(process.cwd(), 'package.json'));
  const devServerOptions = {
    historyApiFallback: true,
    hot: false,
    inline: true,
    host: 'localhost',
    port: cmless.port || 3000,
    stats: { colors: true },
  };

  WebpackDevServer.addDevServerEntrypoints(webpackConfig, devServerOptions);

  const webpack = require('webpack');
  const compiler = webpack(webpackConfig);
  const server = new WebpackDevServer(compiler, devServerOptions);

  server.listen(devServerOptions.port, devServerOptions.host, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log(`WebpackDevServer listening at http://${devServerOptions.host}:${devServerOptions.port}`);
  });
};
