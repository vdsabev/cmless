module.exports = (options = {}) => {
  const webpack = require('webpack');
  const config = require('./config');
  const cmless = config(options);
  const port = cmless.port != null ? cmless.port : 3000;

  const WebpackDevServer = require('webpack-dev-server');
  const devServerOptions = {
    historyApiFallback: true,
    hot: false,
    inline: true,
    host: 'localhost',
    port,
    stats: { colors: true },
  };

  WebpackDevServer.addDevServerEntrypoints(cmless, devServerOptions);
  const compiler = webpack(cmless);
  const server = new WebpackDevServer(compiler, devServerOptions);

  server.listen(devServerOptions.port, devServerOptions.host, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log(`WebpackDevServer listening at http://${devServerOptions.host}:${devServerOptions.port}`);
  });
};
