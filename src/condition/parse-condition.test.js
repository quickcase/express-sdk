import parseCondition from './parse-condition.js';

test.each([
  [
    // Simple condition
    'field1 == "value 1"',
    {
      disjunctions: [[{path: 'field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true}]],
      fieldPaths: ['field1'],
    }
  ],
  [
    // Simple negated condition
    'NOT field1 == "value 1"',
    {
      disjunctions: [[{path: 'field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true, negated: true}]],
      fieldPaths: ['field1'],
    }
  ],
  [
    // Simple condition with conjunction
    'field1 == "value 1" AND NOT field2 === "value 2"',
    {
      disjunctions: [
        [
          {path: 'field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true},
          {path: 'field2', operator: 'EQUALS', value: 'value 2', negated: true},
        ]
      ],
      fieldPaths: ['field1', 'field2'],
    }
  ],
  [
    // Simple condition with disjunction
    'field1 MATCHES "^[abc]+" OR NOT(field2 STARTS_WITH_IC "value 2")',
    {
      disjunctions: [
        [
          {path: 'field1', operator: 'MATCHES', value: '^[abc]+'},
        ],
        [
          {path: 'field2', operator: 'STARTS_WITH', value: 'value 2', ignoreCase: true, negated: true},
        ],
      ],
      fieldPaths: ['field1', 'field2'],
    },
  ],
  [
    // Condition with 1-level grouping
    '(field1 EQUALS "value 1" AND field2 EQUALS_IC "value 2") OR (field1 EQUALS "value A" AND field2 EQUALS_IC "value B")',
    {
      disjunctions: [
        [
          {path: 'field1', operator: 'EQUALS', value: 'value 1'},
          {path: 'field2', operator: 'EQUALS', value: 'value 2', ignoreCase: true},
        ],
        [
          {path: 'field1', operator: 'EQUALS', value: 'value A'},
          {path: 'field2', operator: 'EQUALS', value: 'value B', ignoreCase: true},
        ],
      ],
      fieldPaths: ['field1', 'field2'],
    },
  ],
  [
    // Condition with negated 1-level grouping
    'field1 EQUALS "value 1" AND NOT (field2 EQUALS "value B" AND field3 EQUALS "value C")',
    {
      disjunctions: [
        [
          {path: 'field1', operator: 'EQUALS', value: 'value 1'},
          {path: 'field2', operator: 'EQUALS', value: 'value B', negated: true},
        ],
        [
          {path: 'field1', operator: 'EQUALS', value: 'value 1'},
          {path: 'field3', operator: 'EQUALS', value: 'value C', negated: true},
        ],
      ],
      fieldPaths: ['field1', 'field2', 'field3'],
    },
  ],
  [
    // Condition with N-level grouping
    `
    (
      (
        (complex.field1 EQUALS "value 1")
        AND
        (
          complex.field2 EQUALS "value 2" OR complex.field3 EQUALS "value 3"
        )
      )
      OR
      complex.field4 HAS_LENGTH 4
    )
    OR
    complex.field5 EQUALS "value 5"
    `,
    {
      disjunctions: [
        [
          {path: 'complex.field1', operator: 'EQUALS', value: 'value 1'},
          {path: 'complex.field2', operator: 'EQUALS', value: 'value 2'},
        ],
        [
          {path: 'complex.field1', operator: 'EQUALS', value: 'value 1'},
          {path: 'complex.field3', operator: 'EQUALS', value: 'value 3'},
        ],
        [
          {path: 'complex.field4', operator: 'HAS_LENGTH', value: 4},
        ],
        [
          {path: 'complex.field5', operator: 'EQUALS', value: 'value 5'},
        ]
      ],
      fieldPaths: ['complex.field1', 'complex.field2', 'complex.field3', 'complex.field4', 'complex.field5'],
    },
  ],
])('should parse condition: %s', (condition, expected) => {
  expect(parseCondition(condition)).toEqual(expected);
});
