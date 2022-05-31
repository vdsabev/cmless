const fs = require('fs')
const { join } = require('path')

const { handleError } = require('./utils')
const links = require('./links')

links.forEach((link) => {
  fs.symlink(
    join('..', '..', link.target),
    link.target,
    link.isDir ? 'dir' : 'file',
    handleError,
  )
})
