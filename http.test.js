const http = require('./http');

beforeEach(() => {
  fetch.resetMocks();
});

describe(`get`, () => {
  it(`throws an error if response not OK`, async () => {
    fetch.mockResponseOnce('{}', {
      status: 418,
      statusText: `I'm a teapot`,
      headers: { 'Content-Type': 'application/json' },
    });
    try {
      const response = await http.get('/getSettings');
      expect(response).toBe(undefined); // Should never execute
    } catch (error) {
      expect(error.message).toBe(`418 I'm a teapot`);
    }
  });

  it(`returns JSON response`, async () => {
    const settings = { version: '1.0.0', pages: [] };
    fetch.mockResponseOnce(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await http.get('/getSettings');
    expect(response).toEqual(settings);
  });
});

describe(`post`, () => {
  it(`throws an error if response not OK`, async () => {
    fetch.mockResponseOnce('{}', {
      status: 418,
      statusText: `I'm a teapot`,
      headers: { 'Content-Type': 'application/json' },
    });
    try {
      const response = await http.post('/', { body: '{}' });
      expect(response).toBe(undefined); // Should never execute
    } catch (error) {
      expect(error.message).toBe(`418 I'm a teapot`);
    }
  });

  it(`returns response`, async () => {
    const data = { message: 'success' };
    fetch.mockResponseOnce(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await http.post('/', { body: '{}' });
    expect(response).toEqual(data);
  });
});
