const fs = require('fs');
const { defineConfig } = require('vite');
const { createHtmlPlugin } = require('vite-plugin-html');

const theme = require('./theme');

module.exports = (/** @type {import('./types').Settings} */ settings) => {
  const fonts = settings.fonts || {};

  // Destructure `system-ui` out so we can order overrides properly
  const { ['system-ui']: systemUi, ...rest } = theme; // TODO: Test if this is necessary
  const data = {
    favicon: '',
    title: '',
    ...settings,
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      ...settings.meta,
    },
    fonts,
    // Define `system-ui` first, override it if available.
    // Then define the `font-` variables and override them via `theme` if available.
    theme: {
      'system-ui':
        systemUi ||
        `system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`,
      ...Object.entries(fonts).reduce(
        (fonts, [type, name]) => ({
          ...fonts,
          [`font-${type}`]: `${name}, var(--system-ui)`,
        }),
        {},
      ),
      ...rest,
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
        ...settings.alias,
      },
    },
  });
};
