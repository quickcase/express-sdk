export class SyntaxError extends Error {
  constructor(message) {
    super(message);
  }
}

export class OperatorNotSupportedError extends Error {
  constructor(criteria) {
    super('Criteria operator not supported: ' + JSON.stringify(criteria));
  }
}

export class ValueTypeNotSupported extends Error {
  constructor(criteria, actualValue) {
    super(`Criteria ${JSON.stringify(criteria)} does not accept values`
      + `of type '${typeof actualValue}': ${JSON.stringify(actualValue)}`);
  }
}