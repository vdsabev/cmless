const getStyleRule = (options, cmless, variables) => {
  const loaders = [];

  // Use Extract CSS in production, style loader in development to enable HMR for CSS files
  if (options.production) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    loaders.push(MiniCssExtractPlugin.loader);
  } else {
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
            autoprefixer: { browsers: cmless.target.browsers },
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
