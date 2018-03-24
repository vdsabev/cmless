module.exports = (options = {}) => {
  const { join, extname } = require('path');
  const packageJson = require(join(process.cwd(), 'package.json'));

  const input = getValueOrDefault(packageJson.cmless, 'input', '');
  const output = getValueOrDefault(packageJson.cmless, 'output', 'build');

  const cmless = {
    template: join(input, 'index.html'),
    script: join(input, 'index.js'),
    style: join(input, 'style.js'),
    pwa: join(input, 'pwa.js'),
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.production ? 'production' : 'development'),
    },
    assets: ['jpeg', 'jpg', 'ico', 'gif', 'png', 'svg', 'wav', 'mp3', 'json'],

    clean: output ? [join(output, '*')] : undefined,
    serviceWorker: {
      globDirectory: output,
      globPatterns: ['**/*.{html,js,css}'],
      swDest: join(output, 'service-worker.js'),
    },
  };

  // Merge options
  Object.assign(cmless, packageJson.cmless, { input, output });

  // Webpack config
  const webpackConfig = {};
  if (cmless.extends) {
    const cmlessExtends = require(join(process.cwd(), cmless.extends));
    Object.assign(webpackConfig, cmlessExtends(options));
  }

  if (cmless.style && typeof cmless.style === 'string') {
    switch (extname(cmless.style)) {
      case '.ts':
      case '.tsx':
        // TODO: Fix package version when this issue is fixed:
        // https://github.com/theblacksmith/typescript-require/issues/48
        require('typescript-require');
        break;
    }
    cmless.style = require(join(process.cwd(), cmless.style));
  }

  if (cmless.pwa && typeof cmless.pwa === 'string') {
    cmless.pwa = require(join(process.cwd(), cmless.pwa));
  }

  const rules = [];
  if (cmless.script) {
    const { getScriptRule, getTypeScriptRule } = require('./plugins/script');
    switch (extname(cmless.script)) {
      case '.js':
      case '.jsx':
        rules.push(getScriptRule(packageJson.babel.presets));
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
    const { getStyleRule } = require('./plugins/style');
    rules.push(getStyleRule(cmless.style.css));
  }
  if (cmless.assets) {
    const { getAssetRule } = require('./plugins/asset');
    rules.push(getAssetRule(cmless.assets));
  }

  const plugins = [];

  // https://github.com/johnagan/clean-webpack-plugin/issues/10
  if (cmless.clean && options.production) {
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    plugins.push(new CleanWebpackPlugin(cmless.clean, { root: process.cwd() }));
  }

  if (options.production) {
    const webpack = require('webpack');
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
    plugins.push(new UglifyJsPlugin());
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

  if (cmless.pwa) {
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
                src: join(input, 'logo.png'),
                sizes: [48, 96, 128, 192, 256, 384, 512],
              },
            ],

            // Custom options
            publicPath: undefined,
          },
          cmless.pwa
        )
      )
    );
  }

  if (cmless.serviceWorker) {
    const WorkboxPlugin = require('workbox-webpack-plugin');
    plugins.push(new WorkboxPlugin(cmless.serviceWorker));
  }

  return Object.assign(webpackConfig, {
    devtool: options.production ? false : 'inline-source-map',
    context: process.cwd(),
    entry: {
      index: join(process.cwd(), `${cmless.script}`),
    },
    output: {
      publicPath: '/',
      path: join(process.cwd(), cmless.output),
      // Don't use [chunkhash] in development since this will increase compilation time
      // https://github.com/webpack/webpack/issues/2393
      filename: `[name].[${options.production ? 'chunkhash' : 'hash'}].js`,
      sourceMapFilename: '[name].js.map',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
    },
    module: { rules },
    plugins,
  });
};

const getValueOrDefault = (obj, key, defaultValue) => (obj && obj[key] != null ? obj[key] : defaultValue);
