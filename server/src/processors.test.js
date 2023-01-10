jest.mock('./adapters/google');

const google = require('./adapters/google');
const { processData, processPath } = require('./processors');
const home = require('../../fixtures/pages/home.json');

describe(`processPath`, () => {
  test(`home.json`, async () => {
    const result = await processPath(
      home,
      'body.content[].paragraph.elements[].textRun.textStyle.link.url',
      (url) => url.replace('http:', 'https:'),
    );

    expect(
      result.body.content.some(
        (item) =>
          item.paragraph &&
          item.paragraph.elements.some(
            (element) =>
              element.textRun &&
              element.textRun.textStyle.link &&
              element.textRun.textStyle.link.url === 'https://cmless.netlify.app/diary',
          ),
      ),
    ).toBe(true);
  });
});

describe(`processData`, () => {
  const spreadsheetValues = {
    data: {
      range: 'Skills!A1:B11',
      majorDimension: 'ROWS',
      values: [
        ['Name', 'Level'],
        ['Sit', '5'],
        ['Lie down', '3'],
        ['Play dead', '1'],
      ],
    },
  };

  test(`null datasources`, async () => {
    expect(await processData(null)).toEqual({});
  });

  test(`empty datasources`, async () => {
    expect(await processData({})).toEqual({});
  });

  test(`valid Google Sheets URL`, async () => {
    google.sheets.spreadsheets.values.get.mockResolvedValueOnce(spreadsheetValues);

    const result = await processData({
      skills: {
        url: 'https://docs.google.com/spreadsheets/d/1Nz1XGdvz85Tww_D84i65FxFSM23mCcEDV5GjbbyIAjE',
        options: {
          range: 'Skills!A:B',
          columns: {
            Name: 'name',
            Level: 'level',
          },
        },
      },
    });

    expect(result).toEqual({
      skills: [
        { name: 'Sit', level: 5 },
        { name: 'Lie down', level: 3 },
        { name: 'Play dead', level: 1 },
      ],
    });
  });

  test(`undefined column mapping`, async () => {
    google.sheets.spreadsheets.values.get.mockResolvedValueOnce(spreadsheetValues);

    const result = await processData({
      skills: {
        url: 'https://docs.google.com/spreadsheets/d/1Nz1XGdvz85Tww_D84i65FxFSM23mCcEDV5GjbbyIAjE',
        options: {
          range: 'Skills!A:B',
        },
      },
    });

    expect(result).toEqual({
      skills: [
        { Name: 'Sit', Level: 5 },
        { Name: 'Lie down', Level: 3 },
        { Name: 'Play dead', Level: 1 },
      ],
    });
  });

  test(`unsupported URL`, async () => {
    try {
      const response = await processData({
        skills: {
          url: 'https://google.com',
        },
      });
      expect(response).toBe(undefined); // Should never execute
    } catch (error) {
      expect(error).toEqual({
        response: {
          status: 400,
          body: `Unsupported datasource URL: https://google.com`,
        },
        toString: expect.any(Function),
      });
      expect(error.toString()).toBe(error.response.body);
    }
  });
});
