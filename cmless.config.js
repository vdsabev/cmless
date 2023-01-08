const fs = require('fs');
const { defineConfig } = require('vite');
const { createHtmlPlugin } = require('vite-plugin-html');

const theme = require('./theme');

module.exports = (/** @type {import('./types').Settings} */ settings) => {
  const fonts = settings.fonts || {};
  const data = {
    favicon: '',
    title: '',
    ...settings,
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      ...settings.meta,
    },
    fonts,
    theme: {
      ...theme,
      ...Object.entries(fonts).reduce(
        (fonts, [type, name]) => ({
          ...fonts,
          [`font-${type}`]: `${name}, var(--system-ui)`,
        }),
        {},
      ),
      ...settings.theme,
    },
    reset: fs.readFileSync(settings.reset || 'node_modules/cmless/reset.css'),
  };

  return defineConfig({
    plugins: [
      createHtmlPlugin({
        minify: true,
        entry: settings.entry || `${process.cwd()}/src/app.tsx`,
        template: settings.template || 'node_modules/cmless/index.html',
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
