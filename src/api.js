import http from './http'

const apiUrl = '/.netlify/functions'

export * from '../api/src/utils'

// Services
/** @return {Promise<import('../types').FolderDocument[]>} */
export function getDocumentJSON(/** @type {string} */ url) {
  return http.getJSON(`${apiUrl}/getDocumentJSON?url=${encodeURIComponent(url)}`)
}

/** @return {Promise<import('../types').FolderDocument[]>} */
export function getFolderDocuments(/** @type {string} */ url) {
  return http.getJSON(`${apiUrl}/getFolderDocuments?url=${encodeURIComponent(url)}`)
}

/** @return {Promise<import('../types').Settings>} */
export function getSettings() {
  return http.getJSON(`${apiUrl}/getSettings`)
}
