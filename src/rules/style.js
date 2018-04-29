const getStyleRule = (options, variables) => {
  const loaders = [];

  // Use Extract CSS in production, style loader in development to enable HMR for CSS files
  if (options.production) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    loaders.push(MiniCssExtractPlugin.loader);
  }
  else {
    loaders.push('style-loader');
  }

  // CSS loader
  loaders.push('css-loader');

  // cssnext loader
  const cssnext = require('postcss-cssnext');
  loaders.push({
    loader: 'postcss-loader',
    options: {
      plugins: [
        cssnext({
          features: {
            // Source: https://jamie.build/last-2-versions
            autoprefixer: { browsers: ['>0.25%', 'not ie 11', 'not op_mini all'] },
            customProperties: { variables },
          },
        }),
      ],
    },
  });

  return {
    test: /\.css$/,
    use: loaders,
  };
};

exports.getStyleRule = getStyleRule;
