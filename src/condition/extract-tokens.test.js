import extractTokens from './extract-tokens.js';

test.each([
  [
    'Legacy condition without parenthesis',
    // Condition:
    'field1="value1" AND field2="Yes"',
    // Expected:
    [
      'field1', '=', '"value1"',
      'AND',
      'field2', '=', '"Yes"',
    ],
  ],
  [
    'Composed condition with operator symbols',
    '(a = 1 AND b === 2) OR (c=2 AND d===4)',
    [
      '(', 'a', '=', '1', 'AND', 'b', '===', '2', ')',
      'OR',
      '(', 'c', '=', '2', 'AND', 'd', '===', '4', ')',
    ],
  ],
  [
    'Complex field names',
    'complexField.child1 = "Yes" AND prefix_field2 = "No"',
    [
      'complexField.child1', '=', '"Yes"',
      'AND',
      'prefix_field2', '=', '"No"',
    ],
  ],
  [
    'Collection item by ID field path',
    'collectionField[id:item1].value = "Yes"',
    [
      'collectionField[id:item1].value', '=', '"Yes"',
    ],
  ],
  [
    'Collection item by index field path',
    'collectionField[5].value = "Yes"',
    [
      'collectionField[5].value', '=', '"Yes"',
    ],
  ],
  [
    'Relative field path',
    '@.level1.child1 = "Yes"',
    [
      '@.level1.child1', '=', '"Yes"',
    ],
  ],
  [
    'Quoted strings',
    'field1 = "Value with space" OR field2 = "#ValueWithSpecial(Chars)!"',
    [
      'field1', '=', '"Value with space"',
      'OR',
      'field2', '=', '"#ValueWithSpecial(Chars)!"',
    ],
  ],
  [
    'Leading, middling and trailing spaces',
    '   field1   =   1   ',
    [
      'field1', '=', '1',
    ],
  ],
  [
    'Negated condition',
    '(a = 1 AND NOT (b === 2)) OR NOT(NOT(c=2) AND d===4)',
    [
      '(', 'a', '=', '1', 'AND', 'NOT', '(', 'b', '===', '2', ')', ')',
      'OR',
      'NOT', '(', 'NOT', '(', 'c', '=', '2', ')', 'AND', 'd', '===', '4', ')',
    ],
  ],
  [
    'Condition formatted with line breaks',
    `
    (
      a = 1 AND NOT (b === 2)
    ) OR NOT(c===3)
    `,
    [
      '(', 'a', '=', '1', 'AND', 'NOT', '(', 'b', '===', '2', ')', ')',
      'OR',
      'NOT', '(', 'c', '===', '3', ')',
    ],
  ],
])('should parse condition string into tokens: %s',(name, condition, expected) => {
  const tokens = extractTokens(condition);

  expect(tokens).toEqual(expected);
  expect(tokens).toHaveLength(expected.length); // Ensures there's no trailing `undefined` item
});
