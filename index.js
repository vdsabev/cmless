exports.config = (options) => {
  const autoprefixer = require('autoprefixer');
  const path = require('path');
  const env = require('var');
  const { define } = require('var/webpack');

  const webpack = require('webpack');
  const CleanWebpackPlugin = require('clean-webpack-plugin')
  const ExtractTextPlugin = require('extract-text-webpack-plugin');
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  const NullPlugin = require('webpack-null-plugin');
  const WorkboxPlugin = require('workbox-webpack-plugin');

  return ({ production } = {}) => ({
    devtool: production ? false : 'inline-source-map',
    context: process.cwd(),
    entry: options.entry,
    output: {
      publicPath: '/',
      path: path.resolve(options.build),
      filename: '[name].[chunkhash].js',
      sourceMapFilename: '[name].js.map'
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.scss']
    },
    module: {
      rules: [
        // Scripts
        { test: /\.tsx?$/, loader: 'ts-loader' },

        // Styles
        {
          test: /\.s?css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader']
          })
        },

        // Assets
        {
          test: /\.(jpe?g|ico|gif|png|svg|wav|mp3|json)$/,
          loader: 'file-loader?name=[name].[ext]'
        }
      ]
    },
    plugins: [
      production ? new CleanWebpackPlugin([`${options.build}/*`]) : new NullPlugin(),

      options && options.entry && options.entry.vendor ? new webpack.optimize.CommonsChunkPlugin('vendor') : new NullPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.DefinePlugin(define(env, (envJsonKeys) => ['NODE_ENV', ...envJsonKeys])),
      new webpack.LoaderOptionsPlugin({
        options: {
          postcss: () => [
            autoprefixer({ browsers: ['last 3 versions', '> 1%'] })
          ]
        }
      }),

      // `contenthash` is specific to this plugin, we would typically use `chunkhash`
      new ExtractTextPlugin('styles.[contenthash].css'),
      new HtmlWebpackPlugin({ template: options.template }),
      new WorkboxPlugin({
        globDirectory: options.build,
        globPatterns: ['**/*.{html,js,css}'],
        swDest: path.resolve(options.build, 'service-worker.js')
      })
    ]
  });
};

exports.vendor = (dependencies) => Object.keys(dependencies).filter((dependency) => dependency.indexOf('@types/') === -1);
