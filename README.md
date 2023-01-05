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

If you're using Netlify, set the functions folder in your `netlify.toml` file:

```toml
[build]
  functions = "node_modules/cmless/api/"
```

Or if you need more flexibility - require the Lambda functions directly:

```sh
const { getData } = require('cmless');

exports.handler = getData;
```

You can now call these functions from your local server - with Netlify the function will be at http://localhost:4000/.netlify/functions/getData

# Local development
To start a local server using these functions, first install the dependencies:

```sh
npm install
```

Then, install the `netlify-cli` package globally:
```sh
npm install netlify-cli -g
```

Finally, run `npm start` and call a function, for example http://localhost:4000/api/getDocumentJSON?url=YOUR_DOCUMENT_URL_ENCODED

# With Vite
When using Vite as a bundler, you can create a `vite.config.js` file in your root folder and use `cmless/vite.config`. This gives you out-of-the-box design system, loading Google Fonts, defining CSS reset rules, and more!

```js
import defineConfig from 'cmless/vite.config';

export default defineConfig({
  // These are optional, with some sensible defaults
  entry: 'src/app.tsx',
  template: 'node_modules/cmless/index.html',
  alias: {
    '~': 'src',
  },

  // Only `favicon` and `title` are required
  favicon:
    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 110 110%22><text y=%22.9em%22 font-size=%2290%22>🔨</text></svg>',
  title: 'Hammer - a website about hammers',
  meta: {
    author: 'MC Hammer',
    description: 'Stop, collaborate and listen!',
  },
  fonts: {
    title: 'Montserrat',
    text: 'Inter',
  },
});
```
