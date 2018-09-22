const { join, extname } = require('path');
require('ts-node').register();

const requireOptionally = require('./require-optionally');

module.exports = (options) => {
  const cmless = require('./cmless')(options);

  // Values
  // Allows conditionally requiring config files if a string was passed, uses the value as is otherwise
  const values = ['style', 'pwa'].reduce((result, key) => {
    const value = cmless[key];
    return Object.assign(result, {
      [key]: typeof value === 'string' ? requireOptionally(join(process.cwd(), value)) : value,
    });
  }, {});

  // RULES
  const rules = [];

  // Script
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

  // Style
  if (cmless.style) {
    const getStyleRule = require('./rules/style');
    rules.push(getStyleRule(options, cmless, values.style ? values.style.css : null));
  }

  // Assets
  if (cmless.assets) {
    const getAssetRule = require('./rules/asset');
    rules.push(getAssetRule(options, cmless.assets));
  }

  // PLUGINS
  const plugins = [];

  // Clean
  if (cmless.clean && options.production) {
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    // Must specify project root, see: https://github.com/johnagan/clean-webpack-plugin/issues/10
    plugins.push(new CleanWebpackPlugin(cmless.clean, { root: process.cwd() }));
  }

  // Environment variables
  if (cmless.env) {
    const webpack = require('webpack');
    plugins.push(new webpack.EnvironmentPlugin(cmless.env));
  }

  // Style
  const optimization = {};
  if (cmless.style && options.production) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    plugins.push(new MiniCssExtractPlugin({ filename: '[name].[hash].css' }));

    // TODO: Remove this if webpack v5 supports CSS minification out of the box.
    // Overrides webpack's default minimization options to allow for CSS minification:
    // https://github.com/webpack-contrib/mini-css-extract-plugin#minimizing-for-production
    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
    const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
    optimization.minimizer = [
      new UglifyJsPlugin({ cache: true, parallel: true, sourceMap: true }),
      new OptimizeCSSAssetsPlugin({}),
    ];
  }

  // Template
  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(new HtmlWebpackPlugin({ template: cmless.template, style: values.style }));
  }

  // PWA
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

  // Service worker
  if (cmless.serviceWorker) {
    const { GenerateSW } = require('workbox-webpack-plugin');
    const serviceWorkerListToRegex = (key) =>
      cmless.serviceWorker[key]
        ? {
            [key]: cmless.serviceWorker[key].map((value) => new RegExp(value)),
          }
        : {};

    plugins.push(
      new GenerateSW(
        Object.assign(
          {},
          cmless.serviceWorker,
          serviceWorkerListToRegex('navigateFallbackBlacklist'),
          serviceWorkerListToRegex('navigateFallbackWhitelist')
        )
      )
    );
  }

  // Webpack config
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
    optimization,
  };
};
