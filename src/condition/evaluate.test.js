import recordExtractor from '../record/extractor.js';
import {OperatorNotSupportedError, ValueTypeNotSupported} from './errors.js';
import parse from './parse-condition.js'
import evaluate from './evaluate.js';

const extractor = recordExtractor({
  data: {
    textField: 'Value 1',
    yesNoField: 'Yes',
    field3: 'Value 3',
    field4: 'Value 4',
    multiSelectField: ['Option 1', 'Option 2', 'Option 3'],
    collectionField: [
      {id: '1', value: {}},
      {id: '2', value: {}},
    ],
    complexField: {},
  },
});

test('should return false when field not found for positive criteria', () => {
  const condition = parse('notFound === "Value 1"');

  expect(evaluate(extractor)(condition)).toBe(false);
});

test('should return true when field not found for negative criteria', () => {
  const condition = parse('NOT notFound === "Value 1"');

  expect(evaluate(extractor)(condition)).toBe(true);
});

test('should throw error when criteria operator not supported', () => {
  const condition = {
    disjunctions: [
      [{path: 'field1', operator: 'XXX', value: 'Value 1'}],
    ],
  };

  expect(() => evaluate(extractor)(condition)).toThrow(OperatorNotSupportedError);
});

describe('Disjunctions & Conjunctions', () => {
  test.each([
    ['textField == "Value 1" AND yesNoField == "Yes"', true],
    ['textField == "Value 1" AND yesNoField == "No"', false],
    ['textField == "Value 1" OR yesNoField == "Yes"', true],
    ['textField == "Value 1" OR yesNoField == "No"', true],
    ['(textField == "Value 1" AND yesNoField == "No") OR (field3 == "Value 3" AND field4 == "Value 4")', true],
    ['(textField == "Value 1" AND yesNoField == "No") AND (field3 == "Value 3" AND field4 == "Value 4")', false],
    ['(textField == "Value 1" AND yesNoField == "Yes") AND (field3 == "Value 3" AND field4 == "Value 4")', true],
    ['(textField == "Value 1" OR yesNoField == "No") AND (field3 == "Value 3" OR field4 == "xxx")', true],
    ['(textField == "Value 1" OR yesNoField == "No") AND NOT (field3 == "Value 3" OR field4 == "xxx")', false],
    ['(textField == "Value 1" OR yesNoField == "No") AND NOT (field3 == "yyy" OR field4 == "xxx")', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('CONTAINS (text field)', () => {
  test.each([
    // Case sensitive
    ['textField CONTAINS "lue"', true],
    ['textField CONTAINS "Value 1"', true],
    ['textField CONTAINS "L"', false],
    // Case insensitive
    ['textField CONTAINS_IC "LUE"', true],
    ['textField CONTAINS_IC "VALUE 1"', true],
    ['textField CONTAINS_IC "L"', true],
    // Incorrect
    ['textField CONTAINS "alx"', false],
    ['textField CONTAINS_IC "alx"', false],
    ['textField CONTAINS "Value 1X"', false],
    ['textField CONTAINS_IC "VALUE 1X"', false],
    // Negation
    ['NOT textField CONTAINS "ue"', false],
    ['NOT textField CONTAINS_IC "UE"', false],
    ['NOT textField CONTAINS "UE"', true],
    ['NOT textField CONTAINS_IC "XUE"', true],
    // Field not found
    ['unknownField CONTAINS "Value"', false],
    ['unknownField CONTAINS_IC "Value"', false],
    ['NOT unknownField CONTAINS "Value"', true],
    ['NOT unknownField CONTAINS_IC "Value"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });

  test('should throw error when value type not supported by operator', () => {
    const condition = parse('complexField CONTAINS "hello"');

    expect(() => evaluate(extractor)(condition)).toThrow(ValueTypeNotSupported);
  });
});

describe('CONTAINS (MultiSelect field)', () => {
  test.each([
    // Case sensitive
    ['multiSelectField CONTAINS "Option 1"', true],
    ['multiSelectField CONTAINS "Option 2"', true],
    ['multiSelectField CONTAINS "Option X"', false],
    // Case insensitive
    ['multiSelectField CONTAINS_IC "option 1"', true],
    ['multiSelectField CONTAINS_IC "option 2"', true],
    ['multiSelectField CONTAINS_IC "option x"', false],
    // Incorrect
    ['multiSelectField CONTAINS "Option"', false],
    ['multiSelectField CONTAINS_IC "option"', false],
    ['multiSelectField CONTAINS "O"', false],
    ['multiSelectField CONTAINS_IC "o"', false],
    // Negation
    ['NOT multiSelectField CONTAINS "Option 1"', false],
    ['NOT multiSelectField CONTAINS_IC "option 1"', false],
    ['NOT multiSelectField CONTAINS "Option X"', true],
    ['NOT multiSelectField CONTAINS_IC "option x"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('ENDS_WITH', () => {
  test.each([
    // Case sensitive
    ['textField ENDS_WITH "lue 1"', true],
    ['textField ENDS_WITH "Value 1"', true],
    ['textField ENDS_WITH "LUE 1"', false],
    // Case insensitive
    ['textField ENDS_WITH_IC "lue 1"', true],
    ['textField ENDS_WITH_IC "VALUE 1"', true],
    ['textField ENDS_WITH_IC "LUE 1"', true],
    // Incorrect
    ['textField ENDS_WITH "xue 1"', false],
    ['textField ENDS_WITH_IC "xue 1"', false],
    ['textField ENDS_WITH "Value 1X"', false],
    ['textField ENDS_WITH_IC "VALUE 1X"', false],
    // Negation
    ['NOT textField ENDS_WITH "ue 1"', false],
    ['NOT textField ENDS_WITH_IC "UE 1"', false],
    ['NOT textField ENDS_WITH "UE 1"', true],
    ['NOT textField ENDS_WITH_IC "XUE 1"', true],
    // Field not found
    ['unknownField ENDS_WITH "Value"', false],
    ['unknownField ENDS_WITH_IC "Value"', false],
    ['NOT unknownField ENDS_WITH "Value"', true],
    ['NOT unknownField ENDS_WITH_IC "Value"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('EQUALS', () => {
  test.each([
    // Case sensitive
    ['textField === "Value 1"', true],
    ['textField === "VALUE 1"', false],
    // Case insensitive
    ['textField == "Value 1"', true],
    ['textField == "VALUE 1"', true],
    // Not exactly equals
    ['textField === "Value"', false],
    ['textField == "VALUE"', false],
    // Negation
    ['NOT textField === "Value 1"', false],
    ['NOT textField == "VALUE 1"', false],
    ['NOT textField === "Value"', true],
    ['NOT textField == "VALUE"', true],
    // Field not found
    ['unknownField === "Value"', false],
    ['unknownField == "Value"', false],
    ['NOT unknownField === "Value"', true],
    ['NOT unknownField == "Value"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('HAS_LENGTH', () => {
  test.each([
    // Text length
    ['textField HAS_LENGTH 7', true],
    ['textField HAS_LENGTH 6', false],
    ['textField HAS_LENGTH 8', false],
    // MultiSelect length
    ['multiSelectField HAS_LENGTH 3', true],
    ['multiSelectField HAS_LENGTH 2', false],
    ['multiSelectField HAS_LENGTH 4', false],
    // Collection length
    ['collectionField HAS_LENGTH 2', true],
    ['collectionField HAS_LENGTH 1', false],
    ['collectionField HAS_LENGTH 3', false],
    // Negation
    ['NOT textField HAS_LENGTH 7', false],
    ['NOT textField HAS_LENGTH 6', true],
    ['NOT multiSelectField HAS_LENGTH 3', false],
    ['NOT multiSelectField HAS_LENGTH 2', true],
    ['NOT collectionField HAS_LENGTH 2', false],
    ['NOT collectionField HAS_LENGTH 1', true],
    // Field not found
    ['unknownField HAS_LENGTH 3', false],
    ['NOT unknownField HAS_LENGTH 3', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('MATCHES', () => {
  test.each([
    // Correct
    ['textField MATCHES "^[a-zA-Z]{5}"', true],
    ['textField MATCHES "\\d+$"', true],
    ['textField MATCHES "^[a-zA-Z]{5}\\s\\d+$"', true],
    // Incorrect
    ['textField MATCHES "^[a-z]"', false],
    ['textField MATCHES "^xxx$"', false],
    ['textField MATCHES "2$"', false],
    // Negation
    ['NOT textField MATCHES "^[a-zA-Z]{5}"', false],
    ['NOT textField MATCHES "2$"', true],
    // Field not found
    ['unknownField MATCHES "xxx"', false],
    ['NOT unknownField MATCHES "xxx"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});

describe('STARTS_WITH', () => {
  test.each([
    // Case sensitive
    ['textField STARTS_WITH "Val"', true],
    ['textField STARTS_WITH "Value 1"', true],
    ['textField STARTS_WITH "VAL"', false],
    // Case insensitive
    ['textField STARTS_WITH_IC "Value"', true],
    ['textField STARTS_WITH_IC "VALUE 1"', true],
    ['textField STARTS_WITH_IC "VALUE"', true],
    // Incorrect
    ['textField STARTS_WITH "ValX"', false],
    ['textField STARTS_WITH_IC "valX"', false],
    ['textField STARTS_WITH "Value 1X"', false],
    ['textField STARTS_WITH_IC "value 1X"', false],
    // Negation
    ['NOT textField STARTS_WITH "Val"', false],
    ['NOT textField STARTS_WITH_IC "VAL"', false],
    ['NOT textField STARTS_WITH "Xal"', true],
    ['NOT textField STARTS_WITH_IC "XAL"', true],
    // Field not found
    ['unknownField STARTS_WITH "xxx"', false],
    ['unknownField STARTS_WITH_IC "xxx"', false],
    ['NOT unknownField STARTS_WITH "xxx"', true],
    ['NOT unknownField STARTS_WITH_IC "xxx"', true],
  ])('%s should be %s', (conditionString, expected) => {
    const condition = parse(conditionString);

    expect(evaluate(extractor)(condition)).toBe(expected);
  });
});