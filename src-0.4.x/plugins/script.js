const getScriptRule = (presets) => ({
  test: /\.jsx?$/,
  loader: 'babel-loader',
  exclude: [/node_modules/],
  query: { presets },
});

const getTypeScriptRule = () => ({
  test: /\.tsx?$/,
  loader: 'ts-loader',
});

exports.getScriptRule = getScriptRule;
exports.getTypeScriptRule = getTypeScriptRule;
