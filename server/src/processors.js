const google = require('./adapters/google');
const utils = require('./utils');

const processors = exports;

// Simplifies manipulating deep object paths
/**
 * @template T
 * @param {T} object
 * @returns {Promise<T>}
 */
processors.processPath = async (
  /** @type {T} */ object,
  /** @type {string} */ path,
  /** @type {(value: any) => Promise<any>} */ processor,
) => {
  if (object == null) return object;

  const [firstKey, ...remainingKeys] = path.split('.');
  const isMapOperation = firstKey.endsWith('[]');
  const normalizedKey = firstKey.replace('[]', '');

  if (remainingKeys.length === 0) {
    return {
      ...object[normalizedKey],
      [normalizedKey]: await processor(object[normalizedKey]),
    };
  }

  return {
    ...object,
    [normalizedKey]: await (object[normalizedKey] && isMapOperation
      ? Promise.all(
          object[normalizedKey].map((value) =>
            processors.processPath(value, remainingKeys.join('.'), processor),
          ),
        )
      : processors.processPath(
          object[normalizedKey],
          remainingKeys.join('.'),
          processor,
        )),
  };
};

processors.processData = async (
  /** @type {Record<string, import('./types').Datasource>} */ datasources,
) => {
  if (!datasources) return {};

  const data = await Promise.all(
    Object.keys(datasources).map(async (key) => {
      const datasource = datasources[key];
      if (utils.isGoogleSheet(datasource.url)) {
        // NOTE: If we ever need to support multiple ranges we can use `spreadsheets.values.batchGet`
        // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchGet
        // We can build an object with sparse fields based on the longest of the resulting arrays
        const result = await google.sheets.spreadsheets.values.get({
          spreadsheetId: utils.getSheetIdByUrl(datasource.url),
          range: datasource.options.range,
        });
        const [columns, ...rowsOfCells] = result.data.values;
        return {
          [key]: rowsOfCells.map(
            toRowObject(
              columns.map(
                (column) => (datasource.options.columns || {})[column] || column,
              ),
            ),
          ),
        };
      } else {
        throw {
          response: {
            status: 400,
            body: `Unsupported datasource URL: ${datasource.url}`,
          },
          toString() {
            return this.response.body;
          },
        };
      }
    }),
  );

  return Object.assign({}, ...data); // Merges the array of objects into each other - `{ ...data }` is not the same!
};

function toRowObject(/** @type {string[]} */ columns) {
  return (/** @type {string[]} */ cells) => {
    return columns.reduce(
      (row, column, index) => ({ ...row, [column]: parseValue(cells[index]) }),
      {},
    );
  };
}

function parseValue(value) {
  const valueAsNumber = Number(value);
  return isNaN(valueAsNumber) || value === '' ? value : valueAsNumber;
}
