const { defineConfig } = require('vite');
const { createHtmlPlugin } = require('vite-plugin-html');

module.exports = (/** @type {import('./types').Settings} */ settings) => {
  return defineConfig({
    plugins: [
      createHtmlPlugin({
        minify: true,
        entry: settings.entry || `${process.cwd()}/src/app.tsx`,
        template: settings.template || 'node_modules/cmless/index.html',
        inject: {
          data: {
            ...settings,
            // Must be defined for the template to compile
            meta: settings.meta || {},
            fonts: settings.fonts || {},
          },
        },
      }),
    ],
    resolve: {
      alias: settings.alias || {
        '~': `${process.cwd()}/src`,
      },
    },
  });
};
