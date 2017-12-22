module.exports = (options) => {
  const path = require('path');

  const packageJson = require(path.join(process.cwd(), 'package.json'));

  const cmless = Object.assign({
    output: 'build',
    script: 'src/index.js',
    template: 'src/index.ejs',
    style: 'src/style.js',
    assets: ['jpeg', 'jpg', 'ico', 'gif', 'png', 'svg', 'wav', 'mp3', 'json']
  }, packageJson.cmless);

  let webpackConfig = {};
  if (cmless.extends) {
    const cmlessExtends = require(path.join(process.cwd(), cmless.extends));
    webpackConfig = cmlessExtends(options);
  }

  const plugins = [];

  // TODO: CleanWebpackPlugin
  // TODO: ModuleConcatenationPlugin
  // TODO: DefinePlugin

  if (cmless.style) {
    const ExtractTextPlugin = require('extract-text-webpack-plugin');
    plugins.push(new ExtractTextPlugin('style.[contenthash].css'));

    if (typeof cmless.style === 'string') {
      cmless.style = require(path.join(process.cwd(), cmless.style));
    }
  }

  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(
      new HtmlWebpackPlugin({
        template: cmless.template,
        style: cmless.style
      })
    );
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
    module: {
      rules: [
        cmless.script ? getScriptRule(packageJson.babel.presets) : null,
        cmless.style ? getStyleRule(cmless.style.css) : null,
        cmless.assets ? getAssetRule(cmless.assets) : null
      ]
    },
    plugins
  });
};

const getScriptRule = (presets) => ({
  test: /\.jsx?$/,
  loader: 'babel-loader',
  exclude: [/node_modules/],
  query: { presets }
});

const getStyleRule = (variables) => {
  const ExtractTextPlugin = require('extract-text-webpack-plugin');
  const cssNext = require('postcss-cssnext');

  return {
    test: /\.css$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            plugins: [
              cssNext({
                features: {
                  autoprefixer: { browsers: ['last 3 versions', '> 1%'] },
                  customProperties: { variables }
                }
              })
            ]
          }
        }
      ]
    })
  }
};

const getAssetRule = (assets) => ({
  // TODO: Use assets parameter
  // test: new RegExp(`/\\.(${assets.join('|')})$`),
  test: /\.(jpe?g|ico|gif|png|svg|wav|mp3|json)$/,
  loader: 'file-loader?name=[name].[ext]'
});
