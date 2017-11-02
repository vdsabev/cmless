module.exports = ({ production }) => {
  const path = require('path');

  const cmless = require(path.join(process.cwd(), 'package.json')).cmless;
  const cmlessExtends = require(path.join(process.cwd(), cmless.extends));
  const webpackConfig = cmlessExtends({ production });

  const config = require('./config');
  const cmlessConfig = config(webpackConfig, { production, ...cmless });

  return {
    devtool: production ? false : 'inline-source-map',
    context: process.cwd(),
    // entry: {
    //   index: `./${APP_DIR}/index.js`,
    //   vendor
    // },
    // output: {
    //   publicPath: '/',
    //   path: path.resolve(BUILD_DIR),
    //   filename: '[name].[chunkhash].js',
    //   sourceMapFilename: '[name].js.map'
    // },
    resolve: {
      extensions: ['.js', '.jsx', '.css']
    },
    ...webpackConfig
  };
};
