const createHttpHandlerWithMethod = (method) => async (url, options) => {
  const response = await fetch(url, { ...options, method });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  if (response.status === 200) {
    return response.headers.get('Content-Type') === 'application/json'
      ? response.json()
      : response.text();
  }
  return undefined;
};

const http = {
  get: createHttpHandlerWithMethod('GET'),
  post: createHttpHandlerWithMethod('POST'),
  put: createHttpHandlerWithMethod('PUT'),
  patch: createHttpHandlerWithMethod('PATCH'),
  delete: createHttpHandlerWithMethod('DELETE'),
};

export default http;
