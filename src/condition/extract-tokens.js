const DIGITS = Object.freeze({
  ZERO: 48,
  NINE: 57,
});

const UPPER = Object.freeze({
  A: 65,
  Z: 90,
});

const LOWER = Object.freeze({
  A: 97,
  Z: 122,
});

const SYMBOLS = Object.freeze({
  AT: 64,
  COLON: 58,
  DOUBLE_QUOTE: 34,
  PARENTHESIS_OPEN: 40,
  PARENTHESIS_CLOSE: 41,
  DOT: 46,
  EQUAL: 61,
  SQUARE_BRACKET_OPEN: 91,
  SQUARE_BRACKET_CLOSE: 93,
  UNDERSCORE: 95,
});

const OPERATOR_SYMBOLS = [
  SYMBOLS.EQUAL, // =
];

const GROUP_DELIMITERS = [
  SYMBOLS.PARENTHESIS_OPEN,
  SYMBOLS.PARENTHESIS_CLOSE,
];

const FIELD_PATH_SYMBOLS = [
  SYMBOLS.AT,
  SYMBOLS.COLON,
  SYMBOLS.DOT,
  SYMBOLS.SQUARE_BRACKET_OPEN,
  SYMBOLS.SQUARE_BRACKET_CLOSE,
  SYMBOLS.UNDERSCORE,
];

const isText = (code) => {
  if (code >= DIGITS.ZERO && code <= DIGITS.NINE) {
    return true;
  }
  if (code >= UPPER.A && code <= UPPER.Z) {
    // A-Z
    return true;
  }
  if (code >= LOWER.A && code <= LOWER.Z) {
    // a-z
    return true;
  }
  if (FIELD_PATH_SYMBOLS.includes(code)) {
    // @._[:]
    return true;
  }
  return false;
};

const isDoubleQuote = (code) => code === SYMBOLS.DOUBLE_QUOTE;

const isOperatorSymbol = (code) => OPERATOR_SYMBOLS.includes(code);

const isGroupDelimiter = (code) => GROUP_DELIMITERS.includes(code);

const textToken = (value) => ({
  value,
  append: (char) => {
    if (!isText(char.charCodeAt(0))) {
      return false;
    }

    return textToken(value + char);
  },
});

const quotedStringToken = (value) => ({
  value,
  append: (char) => {
    if (value.length > 1 && value[0] === value[value.length - 1]) {
      // First and last value are both distinct quoted string delimiters
      return false;
    }

    return quotedStringToken(value + char);
  },
});

const operatorToken = (value) => ({
  value,
  append: (char) => {
    if (!isOperatorSymbol(char.charCodeAt(0))) {
      return false;
    }

    return operatorToken(value + char);
  },
});

const groupToken = (value) => ({
  value,
  append: () => false,
});

const voidToken = () => ({
  append: newToken,
})

const newToken = (char) => {
  const code = char.charCodeAt(0);

  if (isText(code)) {
    return textToken(char);
  } else if (isOperatorSymbol(code)) {
    return operatorToken(char);
  } else if (isDoubleQuote(code)) {
    return quotedStringToken(char);
  } else if (isGroupDelimiter(code)) {
    return groupToken(char);
  }

  // Swallow and ignore char
  return voidToken();
}

const tokenReducer = (tokens, char) => {
  const headTokens = tokens.slice(0, -1);
  const lastToken = tokens.slice(-1)[0];

  const updatedToken = lastToken.append(char);

  if (updatedToken) {
    return [
      ...headTokens,
      updatedToken,
    ];
  }

  return [
    ...tokens,
    newToken(char),
  ];
};

const extractTokens = (conditionString) => {
  return conditionString.trim()
                        .split('')
                        .reduce(tokenReducer, [voidToken()])
                        .map((token) => token.value);
};

export default extractTokens;