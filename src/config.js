const { join, extname } = require('path');
const { isString } = require('./utils');

module.exports = (options) => {
  const cmless = require('./cmless')(options);

  const values = {};
  const plugins = [];

  if (cmless.style && isString(cmless.style)) {
    switch (extname(cmless.style)) {
      case '.ts':
      case '.tsx':
        // TODO: Update package when this issue is resolved:
        // https://github.com/theblacksmith/typescript-require/issues/48
        require('typescript-require');
        break;
    }
    values.style = require(join(process.cwd(), cmless.style));
  }

  if (cmless.template) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    plugins.push(new HtmlWebpackPlugin({ template: cmless.template, style: values.style }));
  }

  return {
    mode: options.production ? 'production' : 'development',
    plugins,
  };
};
