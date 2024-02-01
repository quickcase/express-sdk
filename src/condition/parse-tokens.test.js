import {SyntaxError} from './errors.js';
import parseTokens from './parse-tokens.js';

test('should parse simple conjunction condition without grouping', () => {
  const tokens = [
    'field1', '===', '"value1"',
    'AND',
    'field2', '===', '"Yes"',
  ];

  expect(parseTokens(tokens)).toEqual({
    condition: [
      {path: 'field1', operator: 'EQUALS', value: 'value1'},
      'AND',
      {path: 'field2', operator: 'EQUALS', value: 'Yes'},
    ],
    fieldPaths: ['field1', 'field2'],
  });
});

test('should parse condition with relative field path', () => {
  const tokens = [
    '@.level1.child1', '===', '"value1"',
  ];

  expect(parseTokens(tokens)).toEqual({
    condition: [
      {path: '@.level1.child1', operator: 'EQUALS', value: 'value1'},
    ],
    fieldPaths: ['@.level1.child1'],
  });
});

test('should parse condition with collection item field path', () => {
  const tokens = [
    'collectionField[id:item1].value', '===', '"value1"',
    'AND',
    'collectionField[5].value', '===', '"value1"',
    'AND',
    'complexField.collectionField[id:item1].value', '===', '"value1"',
    'AND',
    'complexField.collectionField[5].value', '===', '"value1"',
  ];

  expect(parseTokens(tokens)).toEqual({
    condition: [
      {path: 'collectionField[id:item1].value', operator: 'EQUALS', value: 'value1'},
      'AND',
      {path: 'collectionField[5].value', operator: 'EQUALS', value: 'value1'},
      'AND',
      {path: 'complexField.collectionField[id:item1].value', operator: 'EQUALS', value: 'value1'},
      'AND',
      {path: 'complexField.collectionField[5].value', operator: 'EQUALS', value: 'value1'},
    ],
    fieldPaths: [
      'collectionField[id:item1].value',
      'collectionField[5].value',
      'complexField.collectionField[id:item1].value',
      'complexField.collectionField[5].value',
    ],
  });
});

test('should remove duplicate field paths', () => {
  const tokens = [
    'field1', '===', '"value1"',
    'OR',
    'field1', '===', '"Yes"',
    'OR',
    'field2', '===', '"Yes"',
  ];

  expect(parseTokens(tokens).fieldPaths).toEqual(['field1', 'field2']); // `field1` only once
});

test('should parse simple condition with redundant grouping', () => {
  const tokens = [
    '(', 'field1', '===', '"value1"', ')',
  ];

  expect(parseTokens(tokens).condition).toEqual([
    [{path: 'field1', operator: 'EQUALS', value: 'value1'}],
  ]);
});

test('should parse composed condition with one level of grouping', () => {
  const tokens = [
    '(', 'a', '===', '"1"', 'AND', 'b', '===', '"2"', ')',
    'OR',
    '(', 'c', '===', '"3"', 'AND', 'd', '===', '"4"', ')',
  ];

  expect(parseTokens(tokens).condition).toEqual([
    [
      {path: 'a', operator: 'EQUALS', value: '1'},
      'AND',
      {path: 'b', operator: 'EQUALS', value: '2'},
    ],
    'OR',
    [
      {path: 'c', operator: 'EQUALS', value: '3'},
      'AND',
      {path: 'd', operator: 'EQUALS', value: '4'},
    ],
  ]);
});

test('should parse conditions with nested groups', () => {
  const tokens = [
    '(',
      '(', 'a', '===', '"1"', ')',
      'AND',
      '(', 'b', '===', '"2"', ')',
    ')',
    'OR',
    'c', '===', '"3"',
  ];

  expect(parseTokens(tokens)).toEqual({
    condition: [
      [
        [{path: 'a', operator: 'EQUALS', value: '1'}],
        'AND',
        [{path: 'b', operator: 'EQUALS', value: '2'}],
      ],
      'OR',
      {path: 'c', operator: 'EQUALS', value: '3'},
    ],
    fieldPaths: ['a', 'b', 'c'],
  });
});

test('should reject GROUP_END outside of group', () => {
  const tokens = ['field1', '===', '"value1"', ')'];

  expect(() => parseTokens(tokens)).toThrow(`Unexpected token ')', expected one of: BINARY_OPERATOR, END`);
  expect(() => parseTokens(tokens)).toThrow(SyntaxError);
});

test.each([
  [
    'Missing value',
    ['field1', '==='],
    'Unexpected end of condition, expected one of: VALUE_NUMBER, VALUE_QUOTED',
  ],
  [
    'Group not closed',
    ['(', 'field1', '===', '"value1"'],
    'Unexpected end of condition, expected one of: BINARY_OPERATOR, GROUP_END',
  ],
])('should reject conditions ending with non-terminal token: %s', (name, tokens, error) => {
  expect(() => parseTokens(tokens)).toThrow(error);
  expect(() => parseTokens(tokens)).toThrow(SyntaxError);
});

test('should parse negated condition', () => {
  const tokens = [
    '(', 'a', '===', '"1"', 'AND', 'NOT', 'b', '===', '"2"', ')',
    'OR',
    'NOT', '(', 'c', '===', '"3"', 'AND', 'NOT', '(', 'd', '===', '"4"', 'OR', 'e', '===', '"5"', ')', ')',
  ];

  expect(parseTokens(tokens).condition).toEqual([
    [
      {path: 'a', operator: 'EQUALS', value: '1'},
      'AND',
      {path: 'b', operator: 'EQUALS', value: '2', negated: true},
    ],
    'OR',
    [
      {path: 'c', operator: 'EQUALS', value: '3', negated: true},
      'OR',
      [
        {path: 'd', operator: 'EQUALS', value: '4'},
        'OR',
        {path: 'e', operator: 'EQUALS', value: '5'},
      ]
    ]
  ]);
});

describe('EQUALS', () => {
  test('should parse all forms of EQUALS operator', () => {
    const tokens = [
      // Case insensitive
      'field1', '=', '"a"', 'AND',
      'field2', '==', '"b"', 'AND',
      'field3', 'EQUALS_IC', '"c"', 'AND',
      // Case sensitive
      'field4', '===', '"d"', 'AND',
      'field5', 'EQUALS', '"e"',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'EQUALS', value: 'a', ignoreCase: true},
      'AND',
      {path: 'field2', operator: 'EQUALS', value: 'b', ignoreCase: true},
      'AND',
      {path: 'field3', operator: 'EQUALS', value: 'c', ignoreCase: true},
      'AND',
      {path: 'field4', operator: 'EQUALS', value: 'd'},
      'AND',
      {path: 'field5', operator: 'EQUALS', value: 'e'},
    ]);
  });

  test('should accept numeric criteria value', () => {
    const tokens = [
      'field1', 'EQUALS', '1',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'EQUALS', value: 1},
    ]);
  });

  test('should reject other values', () => {
    const tokens = [
      'field1', '=', 'abc', // Non-quoted string and non-numeric
    ];

    expect(() => parseTokens(tokens)).toThrow(`Unexpected token 'abc', expected one of: VALUE_NUMBER, VALUE_QUOTED`);
    expect(() => parseTokens(tokens)).toThrow(SyntaxError);
  });
});

describe('STARTS_WITH', () => {
  test('should parse all forms of STARTS_WITH operator', () => {
    const tokens = [
      // Case insensitive
      'field1', 'STARTS_WITH_IC', '"a"', 'AND',
      // Case sensitive
      'field2', 'STARTS_WITH', '"b"',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'STARTS_WITH', value: 'a', ignoreCase: true},
      'AND',
      {path: 'field2', operator: 'STARTS_WITH', value: 'b'},
    ]);
  });

  test('should reject numeric values', () => {
    const tokens = [
      'field1', 'STARTS_WITH', '123',
    ];

    expect(() => parseTokens(tokens)).toThrow(`Unexpected token '123', expected one of: VALUE_QUOTED`);
    expect(() => parseTokens(tokens)).toThrow(SyntaxError);
  });
});

describe('ENDS_WITH', () => {
  test('should parse all forms of ENDS_WITH operator', () => {
    const tokens = [
      // Case insensitive
      'field1', 'ENDS_WITH_IC', '"a"', 'AND',
      // Case sensitive
      'field2', 'ENDS_WITH', '"b"',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'ENDS_WITH', value: 'a', ignoreCase: true},
      'AND',
      {path: 'field2', operator: 'ENDS_WITH', value: 'b'},
    ]);
  });

  test('should reject numeric values', () => {
    const tokens = [
      'field1', 'ENDS_WITH', '123',
    ];

    expect(() => parseTokens(tokens)).toThrow(`Unexpected token '123', expected one of: VALUE_QUOTED`);
    expect(() => parseTokens(tokens)).toThrow(SyntaxError);
  });
});

describe('CONTAINS', () => {
  test('should parse all forms of CONTAINS operator', () => {
    const tokens = [
      // Case insensitive
      'field1', 'CONTAINS_IC', '"a"', 'AND',
      // Case sensitive
      'field2', 'CONTAINS', '"b"',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'CONTAINS', value: 'a', ignoreCase: true},
      'AND',
      {path: 'field2', operator: 'CONTAINS', value: 'b'},
    ]);
  });

  test('should accept numeric criteria value', () => {
    const tokens = [
      'field1', 'CONTAINS', '1',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'CONTAINS', value: 1},
    ]);
  });
});

describe('MATCHES', () => {
  test('should parse MATCHES operator', () => {
    const tokens = [
      'field1', 'MATCHES', '"^[a-z]{3}$"',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'MATCHES', value: '^[a-z]{3}$'},
    ]);
  });

  test('should reject numeric values', () => {
    const tokens = [
      'field1', 'MATCHES', '123',
    ];

    expect(() => parseTokens(tokens)).toThrow(`Unexpected token '123', expected one of: VALUE_QUOTED`);
    expect(() => parseTokens(tokens)).toThrow(SyntaxError);
  });
});

describe('HAS_LENGTH', () => {
  test('should parse HAS_LENGTH operator', () => {
    const tokens = [
      'field1', 'HAS_LENGTH', '3',
    ];

    expect(parseTokens(tokens).condition).toEqual([
      {path: 'field1', operator: 'HAS_LENGTH', value: 3},
    ]);
  });

  test('should reject quoted string values', () => {
    const tokens = [
      'field1', 'HAS_LENGTH', '"abc"',
    ];

    expect(() => parseTokens(tokens)).toThrow(`Unexpected token '"abc"', expected one of: VALUE_NUMBER`);
    expect(() => parseTokens(tokens)).toThrow(SyntaxError);
  });
});
