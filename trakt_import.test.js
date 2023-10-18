const {validateFile} = require('./trakt_import');

test('file exists', () => {
    expect(validateFile('test.csv')).toBe(1);
  });

