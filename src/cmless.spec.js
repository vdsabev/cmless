const { evaluateTemplateStrings } = require('./cmless');

describe(`evaluateTemplateStrings`, () => {
  it(`should return same object if no templates`, () => {
    const input = { a: '1', b: '2', c: '3' };
    expect(evaluateTemplateStrings(input)).toEqual(input);
  });

  it(`should replace expressions`, () => {
    expect(evaluateTemplateStrings(
      { a: '1', b: '${a}2', c: '${b}3' },
    )).toEqual(
      { a: '1', b: '12',    c: '123'   },
    );
  });

  it(`should replace expressions in arrays`, () => {
    expect(evaluateTemplateStrings(
      { a: '1', b: ['${a}2', '${a}3'] },
    )).toEqual(
      { a: '1', b: ['12',    '13']    },
    );
  });

  it(`should replace expressions in nested objects`, () => {
    expect(evaluateTemplateStrings(
      { a: '1', b: { c: '${a}2', d: { e: '${a}3' } } },
    )).toEqual(
      { a: '1', b: { c: '12',    d: { e: '13'    } } },
    );
  });
});
