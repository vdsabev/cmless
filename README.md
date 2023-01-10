<p align="center">
  <img alt="cmless" src="logo.png" />
</p>

<p align="center">
  Seamless tools for building dazzling websites
</p>

<hr />

# Usage
First, install as a dependency:
```sh
npm install cmless
```

Create a `cmless.config.js` file in your root folder and import `cmless`. Out of the box this gives you a design system, loading Google Fonts, defining CSS variables and reset rules, and more!

```js
const defineConfig = require('cmless');

module.exports = defineConfig({
  // Settings that already have some sensible defaults
  entry: 'src/app.tsx',
  template: 'node_modules/cmless/client/index.html',
  // Set to `false` or `null` to not use CSS variables.
  // Otherwise will use the variables defined in `client/theme.js`, allowing you to override them like this:
  theme: {
    'system-ui': 'Comic Sans MS',
  },
  // Set to a string containing CSS to use as a style reset.
  // Set to `true` or leave undefined to use the built-in `client/reset.css`.
  // Set to `false`, `null`, or an empty string to not use a style reset.
  reset: fs.readFileSync('node_modules/cmless/client/reset.css').toString(),

  // Other settings - not defined by default
  favicon:
    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 110 110%22><text y=%22.9em%22 font-size=%2290%22>🔨</text></svg>',
  title: 'Hammer - a website about hammers',
  meta: {
    author: 'MC Hammer',
    description: 'Stop, collaborate, and listen!',
  },
  fonts: {
    title: 'Montserrat',
    text: 'Inter',
  },

  // Optional built-in support for Netlify forms: https://docs.netlify.com/forms/setup
  forms: {
    contact: {
      text: { tagName: 'textarea' },
      email: { tagName: 'input', type: 'email' },
    },
  },
});
```

# Plugins and customizing config
`cmless` uses Vite under the hood, so `defineConfig` returns a Vite config with some plugins pre-configured. To add more plugins or otherwise customize config, for example adding Vue support, try the following:

```js
const vue = require('@vitejs/plugin-vue')
const defineConfig = require('cmless')

const cmless = defineConfig({
  entry: 'src/main.js',
})

module.exports = {
  ...cmless,
  plugins: [...cmless.plugins, vue()],
}
```

# API lambda functions
If you're using Netlify, set the functions folder in your `netlify.toml` file:

```toml
[build]
  functions = "node_modules/cmless/server/"
```

Or if you need more flexibility - require the lambda functions directly:

```sh
const { getData } = require('cmless/server');

exports.handler = getData;
```

You can now call these functions from your local server - with Netlify the function will be at http://localhost:3000/.netlify/functions/getData

# Contribution
To start a local server using these functions, first install the dependencies:

```sh
npm install
```

Then run `npm start` and call a function, for example http://localhost:3000/.netlify/functions/getDocumentJSON?url=YOUR_DOCUMENT_URL_ENCODED
