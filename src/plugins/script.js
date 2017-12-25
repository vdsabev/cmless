const getScriptRule = (presets) => ({
  test: /\.jsx?$/,
  loader: 'babel-loader',
  exclude: [/node_modules/],
  query: { presets }
});

exports.getScriptRule = getScriptRule;
