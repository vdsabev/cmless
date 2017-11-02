module.exports = (options) => {
  const path = require('path');

  const cmless = require(path.join(process.cwd(), 'package.json')).cmless;
  const cmlessExtends = require(path.join(process.cwd(), cmless.extends));
  const webpackConfig = cmlessExtends(options);

  return {
    devtool: options.production ? false : 'inline-source-map',
    context: process.cwd(),
    // entry: {
    //   index: `./${APP_DIR}/index.js`,
    //   vendor
    // },
    output: {
      publicPath: '/',
      path: path.join(process.cwd(), cmless.build),
      filename: '[name].[chunkhash].js',
      sourceMapFilename: '[name].js.map'
    },
    resolve: {
      extensions: ['.js', '.jsx', '.css']
    },
    ...webpackConfig
  };
};
