const { join, extname } = require('path');
const { isString } = require('./utils');

module.exports = (options) => {
  const cmless = require('./cmless')(options);

  // Values
  const values = {};

  if (cmless.style) {
    switch (extname(cmless.style)) {
      case '.ts':
      case '.tsx':
        // TODO: Update package when this issue is resolved:
        // https://github.com/theblacksmith/typescript-require/issues/48
        require('typescript-require');
        break;
    }
    values.style = require(join(process.cwd(), cmless.style));
  }

  // Rules
  const rules = [];

  if (cmless.script) {
    const { getScriptRule, getTypeScriptRule } = require('./rules/script');
    switch (extname(cmless.script)) {
      case '.js':
      case '.jsx':
        rules.push(getScriptRule());
        break;
      case '.ts':
      case '.tsx':
        rules.push(getTypeScriptRule());
        break;
      default:
        throw new Error(`Unsupported script extension for ${cmless.script}, please use .js, .jsx, .ts, .tsx`);
    }
  }

  if (cmless.style) {
    const { getStyleRule } = require('./rules/style');
    rules.push(getStyleRule(values.style.css));
  }

  if (cmless.assets) {
    const { getAssetRule } = require('./rules/asset');
    rules.push(getAssetRule(cmless.assets));
  }

  // Plugins
  const plugins = [];

  // https://github.com/johnagan/clean-webpack-plugin/issues/10
  if (cmless.clean && options.production) {
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    plugins.push(new CleanWebpackPlugin(cmless.clean, { root: process.cwd() }));
  }

  if (cmless.env) {
    const webpack = require('webpack');
    plugins.push(new webpack.EnvironmentPlugin(cmless.env));
  }

  if (cmless.style) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    plugins.push(new MiniCssExtractPlugin());
  }

  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(new HtmlWebpackPlugin({ template: cmless.template, style: values.style }));
  }

  return {
    mode: options.production ? 'production' : 'development',
    devtool: options.production ? false : 'inline-source-map',
    entry: {
      index: join(process.cwd(), `${cmless.script}`),
    },
    output: {
      path: join(process.cwd(), cmless.output),
      // Don't use [chunkhash] in development since this will increase compilation time
      // https://github.com/webpack/webpack/issues/2393
      filename: `[name].[${options.production ? 'chunkhash' : 'hash'}].js`,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'],
    },
    module: { rules },
    plugins,
  };
};
