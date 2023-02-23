import {OperatorNotSupportedError, ValueTypeNotSupported} from './errors.js';

const evaluate = (extractor) => (condition) => {
  const matchRecord = match(extractor);
  return condition.disjunctions.some((conjunctions) => conjunctions.every(matchRecord));
};

const match = (extractor) => (criteria) => {
  const {negated, operator, path} = criteria;
  const actualValue = extractor(path);

  const compare = OPERATORS[operator];

  if (!compare) {
    throw new OperatorNotSupportedError(criteria);
  }

  if (actualValue === undefined || actualValue === null) {
    return negated;
  }

  return Boolean(negated ^ compare(criteria, actualValue));
};

const equalsIgnoreCase = (a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}) === 0;

const OPERATORS = Object.freeze({
  'CONTAINS': (criteria, actualValue) => {
    const {value, ignoreCase} = criteria;
    const expectedValue = String(value);

    if (actualValue instanceof Array) {
      return actualValue.some((item) => {
        if (ignoreCase) {
          return equalsIgnoreCase(item, expectedValue);
        }

        return item === expectedValue;
      });
    }

    if (typeof actualValue !== 'string') {
      throw new ValueTypeNotSupported(criteria, actualValue);
    }

    if (ignoreCase) {
      return actualValue.toLowerCase().includes(expectedValue.toLowerCase());
    }

    return actualValue.includes(expectedValue);
  },
  'ENDS_WITH': (criteria, actualValue) => {
    const {value, ignoreCase} = criteria;
    const expectedValue = String(value);

    if (ignoreCase) {
      if (expectedValue.length > actualValue.length) {
        return false;
      }

      return equalsIgnoreCase(
        actualValue.substring(actualValue.length - expectedValue.length),
        expectedValue
      );
    }

    return actualValue.endsWith(expectedValue);
  },
  'EQUALS': (criteria, actualValue) => {
    const {value, ignoreCase} = criteria;
    const expectedValue = String(value);

    if (ignoreCase) {
      return equalsIgnoreCase(actualValue, expectedValue);
    }

    return actualValue === expectedValue;
  },
  'HAS_LENGTH': (criteria, actualValue) => {
    const {value} = criteria;
    const expectedValue = Number(value);

    return actualValue.length === expectedValue;
  },
  'MATCHES': (criteria, actualValue) => {
    const {value} = criteria;
    const pattern = new RegExp(value);

    return pattern.test(actualValue);
  },
  'STARTS_WITH': (criteria, actualValue) => {
    const {value, ignoreCase} = criteria;
    const expectedValue = String(value);

    if (ignoreCase) {
      if (expectedValue.length > actualValue.length) {
        return false;
      }

      return equalsIgnoreCase(
        actualValue.substring(0, expectedValue.length),
        expectedValue
      );
    }

    return actualValue.startsWith(expectedValue);
  },
});

export default evaluate;