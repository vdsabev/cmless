module.exports = {
  content: ['./data/components/**/*.vue', './public/**/*.html', './src/**/*.vue'],
  theme: {
    extend: {
      animation: {
        fade: 'fade 500ms',
      },
      keyframes: {
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      minHeight: {
        '1/2': 'calc(100% / 2)',
        '1/3': 'calc(100% / 3)',
        '1/4': 'calc(100% / 4)',
        '1/5': 'calc(100% / 5)',
      },
      minWidth: {
        '1/2': 'calc(100% / 2)',
        '1/3': 'calc(100% / 3)',
        '1/4': 'calc(100% / 4)',
        '1/5': 'calc(100% / 5)',
      },
      // transitionDuration: {
      //   DEFAULT: '500ms',
      // },
      // transitionTimingFunction: {
      //   DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // },
      typography: {
        DEFAULT: {
          css: {
            'br:first-child, br:last-child': {
              display: 'none',
            },
            h1: {
              marginTop: '1rem',
              marginBottom: 0,
              '&:first-child': {
                marginTop: 0,
              },
            },
            h2: {
              marginTop: '1rem',
              marginBottom: 0,
              '&:first-child': {
                marginTop: 0,
              },
            },
            'h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p': {
              marginTop: '1rem',
            },
            img: {
              marginTop: 0,
              marginBottom: 0,
              '&:only-child': {
                marginTop: '1rem',
                marginBottom: '1rem',
              },
            },
          },
        },
      },
    },
    lineClamp: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  plugins: [
    // require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('./plugins/line-clamp'),
  ],
}
