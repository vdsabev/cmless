<p align="center">
  <img alt="cmless" src="logo.png" />
</p>

<p align="center">
  A seamless build tool for dazzling front end projects
</p>

<hr />

# Local installation
First, install the package as a dependency:
```
npm install cmless
```

Then modify your `package.json` file to add the following:
```json
{
  "scripts": {
    "start": "cd node_modules/cmless && npm run start && cd ../..",
    "build": "cd node_modules/cmless && npm run build && cd ../.."
  }
}
```

You can then execute `npm start` or `npm run build` in the command line.
