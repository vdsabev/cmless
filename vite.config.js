const { defineConfig } = require('vite');
const { createHtmlPlugin } = require('vite-plugin-html');

module.exports = (/** @type {import('./types.d').Settings} */ settings) => {
  return defineConfig({
    plugins: [
      createHtmlPlugin({
        minify: true,
        entry: settings.entry || 'src/app.tsx',
        template: settings.template || 'node_modules/cmless/index.html',
        inject: { data: settings },
      }),
    ],
    resolve: {
      alias: settings.alias || {
        '~': 'src',
      },
    },
  });
};
