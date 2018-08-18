module.exports = (options, assets) => ({
  test: new RegExp(`\\.(${assets.join('|')})$`),
  loader: 'file-loader?name=[name].[ext]',
});
