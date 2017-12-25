module.exports = (options) => {
  const path = require('path');
  const packageJson = require(path.join(process.cwd(), 'package.json'));

  const cmless = Object.assign({
    output: 'build',
    clean: ['build/*'],
    script: 'src/index.js',
    template: 'src/index.ejs',
    style: 'src/style.js',
    assets: ['jpeg', 'jpg', 'ico', 'gif', 'png', 'svg', 'wav', 'mp3', 'json'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.production ? 'production' : 'development')
    }
  }, packageJson.cmless);

  const webpackConfig = {};
  if (cmless.extends) {
    const cmlessExtends = require(path.join(process.cwd(), cmless.extends));
    Object.assign(webpackConfig, cmlessExtends(options));
  }

  if (cmless.style && typeof cmless.style === 'string') {
    cmless.style = require(path.join(process.cwd(), cmless.style));
  }

  const rules = [];
  if (cmless.script) {
    const { getScriptRule } = require('./plugins/script');
    rules.push(getScriptRule(packageJson.babel.presets));
  }
  if (cmless.style) {
    const { getStyleRule } = require('./plugins/style');
    rules.push(getStyleRule(cmless.style.css));
  }
  if (cmless.assets) {
    const { getAssetRule } = require('./plugins/asset');
    rules.push(getAssetRule(cmless.assets));
  }

  const plugins = [];

  // TODO: Fix skipping because folder "is outside of the project root"
  if (cmless.clean && options.production) {
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    plugins.push(new CleanWebpackPlugin(cmless.clean.map((glob) => path.join(process.cwd(), glob))));
  }

  // TODO: Check if only useful in production
  if (options.production) {
    const webpack = require('webpack');
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
  }

  if (cmless.define) {
    const env = require('var');
    const { define } = require('var/webpack');
    const webpack = require('webpack');
    plugins.push(new webpack.DefinePlugin(Object.assign(define(env), cmless.define)));
  }

  if (cmless.style) {
    const ExtractTextPlugin = require('extract-text-webpack-plugin');
    plugins.push(new ExtractTextPlugin('style.[contenthash].css'));
  }

  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(new HtmlWebpackPlugin({ template: cmless.template, style: cmless.style }));
  }

  // TODO: PwaManifestPlugin
  // TODO: WorkboxPlugin

  // TODO: Support TypeScript

  return Object.assign(webpackConfig, {
    devtool: options.production ? false : 'inline-source-map',
    context: process.cwd(),
    entry: {
      index: path.join(process.cwd(), `${cmless.script}`),
    },
    output: {
      publicPath: '/',
      path: path.join(process.cwd(), cmless.output),
      filename: '[name].[chunkhash].js',
      sourceMapFilename: '[name].js.map'
    },
    resolve: {
      extensions: ['.js', '.jsx', '.css']
    },
    module: { rules },
    plugins
  });
};
