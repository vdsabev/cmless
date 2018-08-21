module.exports = (path) => {
  try {
    // NOTE: Supports both ES6 `default` export and `module.exports`
    const script = require(path);
    return script && script.default || script;
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    console.warn(`Module not found: '${path}'! Continuing...`);
  }
};
