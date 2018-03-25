const getStyleRule = (variables) => {
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  const cssnext = require('postcss-cssnext');

  return {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          plugins: [
            cssnext({
              features: {
                autoprefixer: { browsers: ['last 3 versions', '> 1%'] },
                customProperties: { variables },
              },
            }),
          ],
        },
      },
    ],
  };
};

exports.getStyleRule = getStyleRule;
