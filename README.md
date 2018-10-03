<center>
  ![cmless](https://github.com/cmless/cmless/logo.svg)

  A seamless front end build tool.
</center>

## Installation
### Local
To install the package as a development dependency of your project:
```
npm install cmless -D
```

Then modify your `package.json` file:
```json
{
  "scripts": {
    "start": "cmless start",
    "build": "cmless build"
  },
  "cmless": {
  }
}
```

You can then execute `npm start` or `npm run build` in the command line.

### Global
Alternatively, install the package globally:
```
npm install cmless -g
```

Then run the commands from any compatible project.

## Commands
### `cmless start`
Starts a new development server

### `cmless build`
Builds your application for production.

## Options
Modify the `cmless` object in your project's `package.json` to change build options. For the default configuration, see this project's [`package.json`](./package.json).

- `browserslist` - a list of target browsers to autoprefix CSS for. See [Browserslist](https://github.com/browserslist/browserslist) documentation
- `cmless`
  - `port` - the port on which to run the development server
  - `input` - the main input folder
  - `template` - the main HTML template file
  - `script` - the main JavaScript / TypeScript file
  - `style` - a JavaScript / TypeScript file exporting variables that can be used in CSS, HTML, and JavaScript
  - `pwa`
  - `env` - environment variables, for example the `NODE_ENV` variable can be used with `process.env.NODE_ENV`
  - `assets` - a list of file extensions supported by the file loader
  - `output` - the folder output files will be saved to after building for production
  - `clean` - a list of folders to clean before each production build
  - `serviceWorker` - see available options in the [Workbox webpack plugin](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) documentation
