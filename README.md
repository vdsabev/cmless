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

Then require the Lambda functions in your own Lambda function:

```sh
const { getData } = require('cmless');

exports.handler = getData;
```

You can now call this function from your local server, for example if you're running Netlify the function will be at http://localhost:4000/.netlify/functions/getData

# Local development
To start a local server using these functions, first install the dependencies:

```sh
npm install
```

Then, install the `netlify-cli` package globally:
```sh
npm install netlify-cli -g
```

Finally, run `npm start` and call a function, for example http://localhost:4000/api/getDocumentJSON?url=YOUR_DOCUMENT_URL
