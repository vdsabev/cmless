const path = require('path');

module.exports = {
  process(sourceText, sourcePath, options) {
    return {
      code: sourceText.replace(/export default /g, 'module.exports = '),
    };
  },
};
