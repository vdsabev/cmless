const http = require('lessttp');
const google = require('./src/adapters/google');
const utils = require('./src/utils');

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
  /** @returns {Promise<{ statusCode: number, body: string | import('./src/types').FolderDocument[] }>} */
  async handler(request) {
    const folderUrl = decodeURIComponent(request.query.url);
    if (!utils.isGoogleDriveFolder(folderUrl)) {
      return {
        statusCode: 400,
        body: `URL does not point to a folder: ${folderUrl}`,
      };
    }

    // TODO: Cache the request using HTTP headers for 5 minutes, or use an ETag if available in the Google API response
    try {
      const folderId = utils.getFolderIdByUrl(folderUrl);
      const response = await google.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: [
          'files/createdTime',
          'files/description',
          'files/id',
          'files/mimeType',
          'files/name',
          // Commented out because it gives 403 & 404 errors for some reason. See workaround below
          // 'files/thumbnailLink',
          'files/webViewLink',
        ].join(','),
        orderBy: 'createdTime desc',
      });

      const documents = response.data.files.map((file) => ({
        created: file.createdTime,
        description: file.description || '',
        id: file.id,
        name: file.name,
        // thumbnail: file.thumbnailLink.replace(/=s220$/, '=h240'), // Make height consistent to display in gallery
        thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=h240`, // Source: https://en.it1352.com/article/9c47290a24d0423583e5b1e94fdb7817.html
        type: utils.getDocumentType(file.mimeType),
        url: `https://drive.google.com/uc?id=${file.id}`, // Source: https://support.awesome-table.com/hc/en-us/articles/115002196665-Display-images-from-Google-Drive
      }));

      return {
        statusCode: response.status,
        body: documents,
      };
    } catch (error) {
      return {
        statusCode: (error.response && error.response.status) || 500,
        body: error.toString(),
      };
    }
  },
});
