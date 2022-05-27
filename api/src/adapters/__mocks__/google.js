const google = exports

google.docs = {
  documents: {
    get: jest.fn(),
  },
}

google.drive = {
  files: {
    export: jest.fn(),
    list: jest.fn(),
  },
}

google.sheets = {
  spreadsheets: {
    values: {
      get: jest.fn(),
    },
  },
}
