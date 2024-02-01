import normaliseCondition from './normalise-condition.js';

// Shape and content of criteria is irrelevant for normalisation
const criteria = (id) => ({path: 'field-' + id, operator: 'EQUALS', value: 'value-' + id});

// Use letters instead of criterias to improve legibility of test cases
const A = criteria('A');
const B = criteria('B');
const C = criteria('C');
const D = criteria('D');
const E = criteria('E');
const F = criteria('F');
const G = criteria('G');
const H = criteria('H');
const I = criteria('I');
const J = criteria('J');

const AND = 'AND';
const OR = 'OR';

test('should return single empty conjunction for empty condition', () => {
  expect(normaliseCondition([])).toEqual([[]]);
});

test.each([
  [
    'Simple condition',
    // Condition:
    [A],
    // Expected:
    [[A]],
  ],
  [
    'Strip redundant grouping (ie. single member)',
    [[A]],
    [[A]],
  ],
  [
    'Strip redundant grouping recursively (ie. single member)',
    [[[[[A]]]]],
    [[A]],
  ],
  [
    'Disjunctions only',
    [A, OR, B, OR, C],
    [
      [A],
      [B],
      [C],
    ],
  ],
  [
    'Conjunctions only',
    [A, AND, B, AND, C],
    [
      [A, B, C],
    ],
  ],
  [
    'Left-to-right associativity, conjunction first',
    [A, AND, B, OR, C],
    [
      [A, B],
      [C],
    ],
  ],
  [
    'Left-to-right associativity, disjunction first',
    [A, OR, B, AND, C],
    [
      [A, C],
      [B, C],
    ],
  ],
  [
    'Left-to-right associativity, mixed',
    [A, OR, B, AND, C, OR, D, AND, E, AND, F],
    [
      [A, C, E, F],
      [B, C, E, F],
      [D, E, F],
    ],
  ],
])('Single level (ie. no grouping): %s', (name, condition, expected) => {
  expect(normaliseCondition(condition)).toEqual(expected);
});

test.each([
  [
    'Strip redundant grouping (ie. single member)',
    // Condition:
    [[A, AND, B]],
    // Expected:
    [[A, B]],
  ],
  [
    'Strip redundant grouping recursively (ie. single member)',
    [[[[[A, AND, B]]]]],
    [[A, B]],
  ],
  [
    'Leading group',
    [[A, OR, B], AND, C],
    [
      [A, C],
      [B, C],
    ],
  ],
  [
    'Trailing group',
    [A, OR, [B, AND, C]],
    [
      [A],
      [B, C],
    ],
  ],
  [
    'Groups on both sides',
    [[A, AND, B], OR, [C, AND, D]],
    [
      [A, B],
      [C, D],
    ],
  ],
  [
    'Left-to-right associativity in leading group',
    [[A, AND, B, OR, C], OR, D],
    [
      [A, B],
      [C],
      [D],
    ],
  ],
  [
    'Left-to-right associativity in trailing group',
    [A, AND, [B, AND, C, OR, D]],
    [
      [A, B, C],
      [A, D],
    ],
  ],
  [
    'Left-to-right associativity, mixed',
    [[A, OR, B], AND, [C, OR, D], AND, [E, OR, F], OR, [G, AND, H]],
    [
      [A, C, E],
      [A, C, F],
      [A, D, E],
      [A, D, F],
      [B, C, E],
      [B, C, F],
      [B, D, E],
      [B, D, F],
      [G, H]
    ],
  ],
])('2 levels (ie. no nested groups): %s', (name, condition, expected) => {
  expect(normaliseCondition(condition)).toEqual(expected);
});

test.each([
  [
    'deeply nested, disjunctions only',
    // Condition:
    [[[A, OR, [B, OR, C]], OR, [D, OR, E], OR, [F, OR, G, OR, H]], OR, I, OR, J],
    // Expected:
    [
      [A],
      [B],
      [C],
      [D],
      [E],
      [F],
      [G],
      [H],
      [I],
      [J],
    ],
  ],
  [
    'deeply nested, conjunctions only',
    // Condition:
    [[[A, AND, [B, AND, C]], AND, [D, AND, E], AND, [F, AND, G, AND, H]], AND, I, AND, J],
    // Expected:
    [
      [A, B, C, D, E, F, G, H, I, J],
    ],
  ],
  [
    '4-level nesting, mixed OR/AND',
    // Condition:
    [[[A, AND, [B, OR, C]], AND, [D, AND, E], AND, [F, OR, G, OR, H]], OR, I, OR, J],
    // Expected:
    [
      [A, B, D, E, F],
      [A, B, D, E, G],
      [A, B, D, E, H],
      [A, C, D, E, F],
      [A, C, D, E, G],
      [A, C, D, E, H],
      [I],
      [J],
    ],
  ],
  [
    'deeply nested redundant grouping',
    // Condition:
    [[[[[A, AND, [[B]]]], OR, C]]], // equivalent: [A, AND, B], OR, C
    // Expected:
    [
      [A, B],
      [C],
    ],
  ],
])('N levels (ie. nested groups): %s', (name, condition, expected) => {
  expect(normaliseCondition(condition)).toEqual(expected);
});
