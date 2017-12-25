module.exports = (options) => {
  const webpack = require('webpack');
  const config = require('./config');
  const cmless = config(options);
  const compiler = webpack(cmless);

  const WebpackDevServer = require('webpack-dev-server');
  const server = new WebpackDevServer(compiler, {
    stats: { colors: true },
    historyApiFallback: true
  });

  const port = cmless.port != null ? cmless.port : 3000;
  server.listen(port, 'localhost', (error) => {
    if (error) console.log(error);
    console.log(`WebpackDevServer listening at localhost:${port}`);
  });
};
