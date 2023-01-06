const http = require('lessttp');
const { processData } = require('./src/processors');

// TODO: Cache the request using HTTP headers
exports.handler = http.function({
  request: {
    query: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              range: { type: 'string' },
              columns: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
  },
  async handler(request) {
    try {
      return {
        body: await processData(request.query),
      };
    } catch (error) {
      return {
        statusCode: (error.response && error.response.status) || 500,
        body: error.toString(),
      };
    }
  },
});
