const http = require('lessttp');
const { processData } = require('./src/processors');

// TODO: Cache the request using HTTP headers
exports.handler = http.function({
  method: 'POST',
  request: {
    body: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        url: { type: 'string' },
        options: {
          type: 'object',
          additionalProperties: {
            range: { type: 'string' },
            columns: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
    },
  },
  async handler(request) {
    try {
      return {
        body: await processData(request.body),
      };
    } catch (error) {
      return {
        statusCode: (error.response && error.response.status) || 500,
        body: error.toString(),
      };
    }
  },
});
