const { JWT } = require('google-auth-library');
const googleapis = require('googleapis');

const serviceAccount = JSON.parse(process.env.GOOGLE_API_KEY);
const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  keyId: serviceAccount.private_key_id,
  scopes: [
    // Other scopes at: https://developers.google.com/identity/protocols/oauth2/scopes#docsv1
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

/** @typedef {import('googleapis/build/src/apis/drive/v3').drive_v3.Schema$File} File */

const google = exports;

google.docs = googleapis.google.docs({ auth, version: 'v1' });

google.drive = googleapis.google.drive({ auth, version: 'v3' });

google.sheets = googleapis.google.sheets({ auth, version: 'v4' });
