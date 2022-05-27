const utils = exports

const documentTypes = {
  image: 'image',
  googleDoc: 'googleDoc',
}

utils.getDocumentType = (/** @type {string} */ mimeType) => {
  if (mimeType.startsWith('image/')) {
    return documentTypes.image
  }
  if (mimeType === 'application/vnd.google-apps.document') {
    return documentTypes.googleDoc
  }
}

// URL utils
// Google Document
const googleDocumentUrlRegex = /^https:\/\/docs\.google\.com\/document(\/u\/\d)?\/d\//

utils.isGoogleDocument = (/** @type {string} */ url) => {
  return googleDocumentUrlRegex.test(url)
}

utils.getDocumentIdByUrl = (/** @type {string} */ url) => {
  return url.replace(googleDocumentUrlRegex, '').replace(/\/pub\??.*/, '')
}

utils.getDocumentUrlById = (/** @type {string} */ documentId) => {
  return `https://docs.google.com/document/d/${documentId}`
}

// Google Drive Folder
const googleDriveFolderUrlRegex =
  /^https:\/\/drive\.google\.com\/drive(\/u\/\d)?\/folders\//

utils.isGoogleDriveFolder = (/** @type {string} */ url) => {
  return googleDriveFolderUrlRegex.test(url)
}

utils.getFolderIdByUrl = (/** @type {string} */ url) => {
  return url.replace(googleDriveFolderUrlRegex, '')
}

utils.getFolderUrlById = (/** @type {string} */ folderId) => {
  return `https://drive.google.com/drive/folders/${folderId}`
}

// Google Sheet
const googleSheetUrlRegex = /^https:\/\/docs\.google\.com\/spreadsheets(\/u\/\d)?\/d\//

utils.isGoogleSheet = (/** @type {string} */ url) => {
  return googleSheetUrlRegex.test(url)
}

utils.getSheetIdByUrl = (/** @type {string} */ url) => {
  return url.replace(googleSheetUrlRegex, '').replace(/\/pub\??.*/, '')
}

utils.getSheetUrlById = (/** @type {string} */ sheetId) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}`
}
