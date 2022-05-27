const http = {
  getJSON(/** @type {string} */ url, options) {
    return fetch(url, options).then(handleFetchJsonResponse)
  },
  post(/** @type {string} */ url, options) {
    return fetch(url, { ...options, method: 'POST' }).then(handleFetchJsonResponse)
  },
}

export default http

const handleFetchJsonResponse = (/** @type {Response} */ response) => {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}
