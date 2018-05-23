const getScriptRule = (options) => ({
  test: /\.jsx?$/,
  loader: 'babel-loader',
  exclude: [/node_modules/],
});

const getTypeScriptRule = (options) => ({
  test: /\.tsx?$/,
  loader: 'ts-loader',
  exclude: [/node_modules/],
});

exports.getScriptRule = getScriptRule;
exports.getTypeScriptRule = getTypeScriptRule;