const http = require('lessttp')
const { baseUrl } = require('../data/settings.json')
const google = require('./src/adapters/google')
const { processPath } = require('./src/processors')
const utils = require('./src/utils')

exports.handler = http.function({
  request: {
    query: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
  },
  /** @returns {Promise<{ statusCode?: number, body: {}, headers?: Record<string, string> }>} */
  async handler(request) {
    const documentUrl = decodeURIComponent(request.query.url)
    if (!utils.isGoogleDocument(documentUrl)) {
      return {
        statusCode: 400,
        body: `Invalid document URL: ${documentUrl}`,
      }
    }

    try {
      const documentId = utils.getDocumentIdByUrl(documentUrl)

      // TODO: Cache the request using HTTP headers for 5 minutes, or use an ETag if available in the Google API response
      const document = await google.docs.documents
        .get({ documentId })
        .then(({ data }) => data)

      return {
        body: await processDocument(document, [
          processLinkURLsMatchingBase,
          processLinkURLsMatchingPages,
        ]),
      }
    } catch (error) {
      return {
        statusCode: (error.response && error.response.status) || 500,
        body: error.toString(),
      }
    }
  },
})

async function processDocument(document, processors) {
  for (const processor of processors) {
    document = await processor(document)
  }
  return document
}

function processLinkURLsMatchingBase(document) {
  return processPath(
    document,
    'body.content[].paragraph.elements[].textRun.textStyle.link.url',
    (urlString) => {
      try {
        const url = new URL(urlString)
        return url.hostname === baseUrl ? url.pathname + url.search + url.hash : url.href
      } catch {
        return urlString
      }
    },
  )
}

// TODO: If the content links to https://drive.google.com/open?id= get the parents of all linked files and link to the parents'
// matching relative URL from `settings.json`. This will further delay the request so caching requests becomes even more important.
function processLinkURLsMatchingPages(document) {
  return document
}
