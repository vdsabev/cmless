const fs = require('fs');

const { defineConfig } = require('vite');
const { createHtmlPlugin } = require('vite-plugin-html');

const theme = require('./client/theme');

module.exports = (/** @type {Partial<import('./types').Settings>} */ settings) => {
  const fonts = settings.fonts || {};
  /** @type {import('./types').Settings} */ const data = {
    favicon: '',
    title: '',
    forms: {},
    ...settings,
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      ...settings.meta,
    },
    fonts,
    theme:
      settings.theme === false || settings.theme === null
        ? {}
        : {
            ...theme,
            ...Object.entries(fonts).reduce(
              (fonts, [type, name]) => ({
                ...fonts,
                [`font-${type}`]: `${name}, var(--system-ui)`,
              }),
              {},
            ),
          },
    reset:
      settings.reset === true || settings.reset === undefined
        ? fs.readFileSync('node_modules/cmless/client/reset.css').toString()
        : settings.reset || '',
  };

  return defineConfig({
    plugins: [
      createHtmlPlugin({
        minify: true,
        entry: settings.entry || `${process.cwd()}/src/app.tsx`,
        template: settings.template || 'node_modules/cmless/client/index.html',
        inject: { data },
      }),
    ],
    resolve: {
      alias: {
        '~': `${process.cwd()}/src`,
      },
    },
  });
};
