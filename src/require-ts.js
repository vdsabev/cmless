const fs = require('fs');
const path = require('path');
const vm = require('vm');
const typescript = require('typescript');

const compilerOptions = {
  module: typescript.ModuleKind.CommonJS,
};

const requireTs = (filename, options = {}) => {
  const content = fs.readFileSync(filename, 'utf8');

  const compiled = typescript.transpileModule(
    content,
    Object.assign({}, options, {
      compilerOptions: Object.assign({}, compilerOptions, options.compilerOptions),
    })
  );

  const sandbox = Object.assign({}, global, {
    require: module.require.bind(module),
    exports: module.exports,
    __filename: filename,
    __dirname: path.dirname(module.filename),
    module,
  });
  sandbox.global = sandbox;

  vm.runInNewContext(compiled.outputText, sandbox, { filename });
  return sandbox.exports;
};

requireTs.config = (newCompilerOptions) => Object.assign(compilerOptions, newCompilerOptions);

module.exports = requireTs;
