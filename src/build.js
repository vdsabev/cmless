module.exports = (options = {}) => {
  const webpack = require('webpack')
  const config = require('./config')(options)

  const compiler = webpack(config)
  compiler.run(() => {}) // Empty function to fix `TypeError: callback is not a function`
}
