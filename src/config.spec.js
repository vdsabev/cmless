const configFactory = require('./config')

describe(`configFactory`, () => {
  it(`should return production mode if production is true`, () => {
    expect(configFactory({ production: true })).toHaveProperty('mode', 'production')
  })

  it(`should return development mode if production is false`, () => {
    expect(configFactory({ production: false })).toHaveProperty('mode', 'development')
  })
})
