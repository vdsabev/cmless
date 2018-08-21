const { join } = require('path');
const _ = require('lodash');

const requireOptionally = require('./require-optionally');

const cmless = (options) => {
  const defaultPackage = requireOptionally(join(__dirname, '..', 'package.json'));
  const projectPackage = requireOptionally(join(process.cwd(), 'package.json'));
  return evaluateTemplateStrings(
    _.merge({}, defaultPackage.cmless, projectPackage ? projectPackage.cmless : {})
  );
};

const evaluateTemplateStrings = (input, values) =>
  Object.keys(input).reduce((output, key) => {
    output[key] = input[key];

    if (!values) {
      values = output;
    }

    Object.keys(values).forEach((valueKey) => {
      const evaluateExpressionWithKeyAndValue = evaluateExpression(valueKey, values[valueKey]);
      if (_.isArray(output[key])) {
        output[key] = output[key].map(evaluateExpressionWithKeyAndValue);
      } else if (_.isObject(output[key])) {
        output[key] = evaluateTemplateStrings(output[key], values);
      } else if (_.isString(output[key])) {
        output[key] = evaluateExpressionWithKeyAndValue(output[key]);
      }
    });

    return output;
  }, {});

const evaluateExpression = (key, value) => (expression) =>
  expression.replace('${' + key + '}', value);

module.exports = cmless;
module.exports.evaluateTemplateStrings = evaluateTemplateStrings;
