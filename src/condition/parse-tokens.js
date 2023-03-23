import {FIELD_PATH_PATTERN} from '../record';
import {SyntaxError} from './errors';

const xor = (a, b) => Boolean(a) !== Boolean(b);

/**
 * The root of a condition, shaped as a top-level group.
 */
class Root {
  constructor(members = []) {
    this.members = members;
    this.negated = false; // Root can never be negated!
  }

  add(member) {
    return new Root([...this.members, member]);
  }

  addCriteria(criteria) {
    return this.add(criteria);
  }

  addBinaryOperator(operator) {
    return this.add(operator);
  }

  createChildGroup(negated) {
    return new Group([], negated);
  }
}

/**
 * A group of tokens with `negated` flag transposing negation to each group members.
 */
class Group extends Root {
  constructor(members, negated) {
    super(members);
    this.negated = negated;
  }

  add(member) {
    return new Group([...this.members, member], this.negated);
  }

  addCriteria(criteria) {
    const {negated, ...rest} = criteria;

    return this.add({
      ...rest,
      ...(xor(this.negated, negated) ? {negated: true} : {}),
    });
  }

  addBinaryOperator(operator) {
    const negatedOperator = ({
      AND: 'OR',
      OR: 'AND',
    })[operator];

    return this.add(this.negated ? negatedOperator: operator);
  }

  createChildGroup(negated) {
    return new Group([], xor(this.negated, negated));
  }
}

const compOperator = (acceptTokens, nextStates, transform = (token) => ({operator: token})) => ({
  accept: (token) => acceptTokens.includes(token),
  apply: ({stack, ...rest}, token) => {
    const [criteria, ...tail] = stack;
    const operator = transform(token);
    return {
      ...rest,
      stack: [
        {
          ...criteria,
          ...operator,
        },
        ...tail
      ],
    };
  },
  nextStates: () => nextStates,
});

const compOperatorWithCase = (options) => {
  const {
    targetToken,
    caseSensitiveTokens,
    caseInsensitiveTokens,
    nextStates,
  } = options;

  const acceptTokens = [...caseSensitiveTokens, ...caseInsensitiveTokens];
  const transform = (token) => {
    if (caseInsensitiveTokens.includes(token)) {
      return ({operator: targetToken, ignoreCase: true});
    }

    return ({operator: targetToken});
  };

  return compOperator(acceptTokens, nextStates, transform);
};

// Shortlist of comparison operators
const COMP_OPERATORS = Object.freeze({
  COMP_CONTAINS: compOperatorWithCase({
    targetToken: 'CONTAINS',
    caseSensitiveTokens: ['CONTAINS'],
    caseInsensitiveTokens: ['CONTAINS_IC'],
    nextStates: ['VALUE_NUMBER', 'VALUE_QUOTED'],
  }),
  COMP_EQUALS: compOperatorWithCase({
    targetToken: 'EQUALS',
    caseSensitiveTokens: ['===', 'EQUALS'],
    caseInsensitiveTokens: ['=', '==', 'EQUALS_IC'],
    nextStates: ['VALUE_NUMBER', 'VALUE_QUOTED'],
  }),
  COMP_ENDS_WITH: compOperatorWithCase({
    targetToken: 'ENDS_WITH',
    caseSensitiveTokens: ['ENDS_WITH'],
    caseInsensitiveTokens: ['ENDS_WITH_IC'],
    nextStates: ['VALUE_QUOTED'],
  }),
  COMP_HAS_LENGTH: compOperator(['HAS_LENGTH'], ['VALUE_NUMBER']),
  COMP_MATCHES: compOperator(['MATCHES'], ['VALUE_QUOTED']),
  COMP_STARTS_WITH: compOperatorWithCase({
    targetToken: 'STARTS_WITH',
    caseSensitiveTokens: ['STARTS_WITH'],
    caseInsensitiveTokens: ['STARTS_WITH_IC'],
    nextStates: ['VALUE_QUOTED'],
  }),
});

const STATES = {
  BINARY_OPERATOR: {
    accept: (token) => ['AND', 'OR'].includes(token),
    apply: ({stack, ...rest}, token) => {
      const [parent, ...ancestors] = stack;

      return {
        ...rest,
        stack: [
          parent.addBinaryOperator(token),
          ...ancestors,
        ],
      };
    },
    nextStates: () => ['GROUP_START', 'NOT_OPERATOR', 'FIELD_PATH'],
  },
  ...COMP_OPERATORS,
  END: {
    accept: () => false,
  },
  FIELD_PATH: {
    accept: (token) => FIELD_PATH_PATTERN.test(token),
    apply: (context, token) => {
      const {fieldPaths, negateNext, stack, ...rest} = context;

      return {
        ...rest,
        negateNext: false,
        fieldPaths: fieldPaths.add(token),
        stack: [
          {
            path: token,
            ...(negateNext ? {negated: true} : {}),
          },
          ...stack,
        ],
      };
    },
    nextStates: () => Object.keys(COMP_OPERATORS),
  },
  GROUP_END: {
    accept: (token) => token === ')',
    apply: ({stack, ...rest}) => {
      const [group, parent, ...ancestors] = stack;
      return {
        ...rest,
        stack: [
          // Fold into parent
          parent.add(group.members),
          ...ancestors,
        ],
      };
    },
    nextStates: ({stack}) => {
      if (stack[0] instanceof Group) {
        return ['BINARY_OPERATOR', 'GROUP_END'];
      }

      return ['BINARY_OPERATOR', 'END'];
    },
  },
  GROUP_START: {
    accept: (token) => token === '(',
    apply: (context) => {
      const {negateNext, stack, ...rest} = context;
      const [parent] = stack;
      return {
        ...rest,
        negateNext: false,
        stack: [
          parent.createChildGroup(negateNext),
          ...stack,
        ],
      };
    },
    nextStates: () => ['GROUP_START', 'NOT_OPERATOR', 'FIELD_PATH'],
  },
  NOT_OPERATOR: {
    accept: (token) => 'NOT' === token,
    apply: ({negateNext, ...rest}) => ({
      ...rest,
      negateNext: true,
    }),
    nextStates: () => ['GROUP_START', 'FIELD_PATH'],
  },
  START: {
    nextStates: () => ['GROUP_START', 'NOT_OPERATOR', 'FIELD_PATH'],
  },
  VALUE_NUMBER: {
    accept: (token) => /^\d+$/.test(token),
    apply: ({stack, ...rest}, token) => {
      const [criteria, parent, ...ancestors] = stack;

      return {
        ...rest,
        stack: [
          // Fold criteria into parent
          parent.addCriteria({...criteria, value: Number(token)}),
          ...ancestors,
        ],
      };
    },
    nextStates: ({stack}) => {
      if (stack[0] instanceof Group) {
        return ['BINARY_OPERATOR', 'GROUP_END'];
      }

      return ['BINARY_OPERATOR', 'END'];
    },
  },
  VALUE_QUOTED: {
    accept: (token) => /^"[^"]*"$/.test(token),
    apply: ({stack, ...rest}, token) => {
      const [criteria, parent, ...ancestors] = stack;

      return {
        ...rest,
        stack: [
          // Fold criteria into parent
          parent.addCriteria({...criteria, value: token.slice(1, -1)}),
          ...ancestors,
        ],
      };
    },
    nextStates: ({stack}) => {
      if (stack[0] instanceof Group) {
        return ['BINARY_OPERATOR', 'GROUP_END'];
      }

      return ['BINARY_OPERATOR', 'END'];
    },
  },
};

const parseToken = (acc, token) => {
  const {state, context} = acc;

  const nextStates = state.nextStates(context);

  const nextStateId = nextStates.find((stateId) => STATES[stateId].accept(token));

  if (!nextStateId) {
    throw new SyntaxError(`Unexpected token '${token}', expected one of: ` + nextStates.join(', '));
  }

  const nextState = STATES[nextStateId];

  return {
    state: nextState,
    context: nextState.apply(context, token),
  };
};

const parseTokens = (tokens) => {
  const {state: finalState, context} = tokens.reduce(parseToken, {
    // Current state
    state: STATES.START,
    context: {
      // Carry negation from `NOT` to next token
      negateNext: false,
      // Parsing stack as FILO list with elements added at the start to leverage array destructuring
      stack: [new Root()],
      fieldPaths: new Set(),
    }
  });

  const endStates = finalState.nextStates(context);
  if (!endStates.includes('END')) {
    throw new SyntaxError('Unexpected end of condition, expected one of: ' + endStates.join(', '));
  }

  return {
    condition: context.stack[0].members,
    fieldPaths: Array.from(context.fieldPaths),
  };
};

export default parseTokens;