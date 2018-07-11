const getScriptRule = (options) => ({
  test: /\.jsx?$/,
  // NOTE: Fixes `Error: Can't resolve 'babel-loader'`
  loader: require.resolve('babel-loader'),
  exclude: [/node_modules/],
});

const getTypeScriptRule = (options) => ({
  test: /\.tsx?$/,
  loader: 'ts-loader',
  exclude: [/node_modules/],
});

exports.getScriptRule = getScriptRule;
exports.getTypeScriptRule = getTypeScriptRule;
