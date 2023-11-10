import {extractItemsFromCSVFile, importConfig} from '../src/importer.js';

it('Test Correct File', () => {
    expect(extractItemsFromCSVFile('test/pass.csv')).not.toBe(0);
});

it('Test Incorrect File', () => {
  expect(extractItemsFromCSVFile('test/fail.csv')).toBe(0);
});

it('Test Correct Config', () => {
  expect(importConfig('test/pass.json')).toBe(1)
});

it('Test Incorrect Config', () => {
  expect(importConfig('test/fail.json')).toBe(0)
});
