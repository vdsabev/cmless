const _ = require('lodash');

module.exports = (options, cmless, variables) => {
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
  const postcssPresetEnv = require('postcss-preset-env');
  loaders.push({
    loader: 'postcss-loader',
    options: {
      plugins: [
        // https://github.com/csstools/postcss-preset-env/issues/32
        postcssPresetEnv({
          stage: 2,
          autoprefixer: { browsers: cmless.browserslist },
          importFrom: [
            {
              'custom-properties': _.mapKeys(variables, (value, key) => `--${key}`),
            },
          ],
          features: {
            'custom-properties': {
              // NOTE: Since the custom properties aren't exported to any CSS file,
              // we need to disable the `preserve` flag to get them to work anywhere
              preserve: false,
            },
            'nesting-rules': true,
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
