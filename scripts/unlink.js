const fs = require('fs')

const { handleError } = require('./utils')
const links = require('./links')

links.forEach((link) => {
  fs.unlink(link.target, handleError)
})
