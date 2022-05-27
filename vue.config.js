const { description } = require('./data/settings.json')

module.exports = {
  outputDir: 'build',
  productionSourceMap: false,
  parallel: false,
  chainWebpack(config) {
    return config
      .plugin('html')
      .tap(([options, ...args]) => [{ ...options, meta: { description } }, ...args])
  },
}
