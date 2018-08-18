module.exports = (options) => ({
  test: /\.[jt]sx?$/,
  loader: 'ts-loader',
  exclude: [/node_modules/],
});
