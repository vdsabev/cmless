const { join, extname } = require('path');
require('ts-node').register();

const requireOptionally = require('./require-optionally');

module.exports = (options) => {
  const cmless = require('./cmless')(options);

  // Values
  const values = {};

  if (cmless.style) {
    values.style = requireOptionally(join(process.cwd(), cmless.style));
  }

  if (cmless.pwa) {
    values.pwa = requireOptionally(join(process.cwd(), cmless.pwa));
  }

  // Rules
  const rules = [];

  if (cmless.script) {
    const getScriptRule = require('./rules/script');
    switch (extname(cmless.script)) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        rules.push(getScriptRule(options));
        break;
      default:
        throw new Error(
          `Unsupported script extension for ${cmless.script}, please use .js, .jsx, .ts, .tsx`
        );
    }
  }

  if (cmless.style) {
    const getStyleRule = require('./rules/style');
    rules.push(getStyleRule(options, cmless, values.style ? values.style.css : null));
  }

  if (cmless.assets) {
    const getAssetRule = require('./rules/asset');
    rules.push(getAssetRule(options, cmless.assets));
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

  if (cmless.style && options.production) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    plugins.push(new MiniCssExtractPlugin());
  }

  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(new HtmlWebpackPlugin({ template: cmless.template, style: values.style }));
  }

  if (values.pwa) {
    const PwaManifestPlugin = require('webpack-pwa-manifest');
    plugins.push(
      new PwaManifestPlugin(
        Object.assign(
          {
            start_url: '/',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              {
                src: join(cmless.input, 'logo.png'),
                sizes: [48, 96, 128, 192, 256, 384, 512],
              },
            ],

            // Custom options
            publicPath: undefined,
          },
          values.pwa
        )
      )
    );
  }

  if (cmless.serviceWorker) {
    const { GenerateSW } = require('workbox-webpack-plugin');
    plugins.push(new GenerateSW(cmless.serviceWorker));
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
