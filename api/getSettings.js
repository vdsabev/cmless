const http = require('lessttp')
const settings = require('../data/settings.json')
const { processData } = require('./src/processors')

// TODO: Cache the request using HTTP headers for 5 minutes
exports.handler = http.function(async () => {
  try {
    return {
      body: {
        ...settings,
        datasources: undefined,
        data: await processData(settings.datasources),
      },
    }
  } catch (error) {
    return {
      statusCode: (error.response && error.response.status) || 500,
      body: error.toString(),
    }
  }
})
