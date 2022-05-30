<p align="center">
  <img alt="cmless" src="logo.png" />
</p>

<p align="center">
  A seamless build tool for dazzling front end projects
</p>

<hr />

# Quick start
Want to get going without installing?

## Start development server
```
npx cmless start
```

## Build website for production
```
npx cmless build
```

# Local installation
To install the package as a development dependency of your project:
```
npm install cmless -D
```

Then modify your `package.json` file to add the following:
```json
{
  "scripts": {
    "start": "cmless start",
    "build": "cmless build"
  }
}
```

You can then execute `npm start` or `npm run build` in the command line.
