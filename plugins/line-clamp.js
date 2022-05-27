const plugin = require('tailwindcss/plugin')

module.exports = plugin(({ addUtilities, variants, theme }) => {
  const lineClampVariants = variants('lineClamp', [])
  const lineClampClasses = theme('lineClamp').reduce(
    (lineClampClasses, value) => ({
      ...lineClampClasses,
      [`.line-clamp-${value || 'none'}`]: {
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': `${value || 'none'}`,
      },
    }),
    {},
  )

  addUtilities(lineClampClasses, lineClampVariants)
})
