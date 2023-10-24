const traktImporter = require('../src/importer.js')

test('Test Correct File', () => {
    expect(traktImporter.extractItemsFromCSVFile('test/pass.csv')).not.toBe(0)
})

test('Test Incorrect File', () => {
  expect(traktImporter.extractItemsFromCSVFile('test/fail.csv')).toBe(0)
})

test('Test Correct Config', () => {
  expect(traktImporter.importConfig('test/pass.json')).toBe(1)
})

test('Test Incorrect Config', () => {
  expect(traktImporter.importConfig('test/fail.json')).toBe(0)
})
