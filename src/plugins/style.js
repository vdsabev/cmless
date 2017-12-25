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

exports.getStyleRule = getStyleRule;
