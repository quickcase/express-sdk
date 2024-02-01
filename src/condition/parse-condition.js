import extractTokens from './extract-tokens.js';
import normaliseCondition from './normalise-condition.js';
import parseTokens from './parse-tokens.js';

/**
 * Parse a raw condition string into a condition object ready for evaluation.
 *
 * @param {string} conditionString - Raw condition string, as captured in definition
 * @return {{disjunctions: Array, fieldPaths: string[]}} - Condition object, formed of array of disjunctions and the
 *  dedup list of field paths targeted by criteria
 */
const parseCondition = (conditionString) => {
  const result = parseTokens(extractTokens(conditionString));
  return {
    fieldPaths: result.fieldPaths,
    disjunctions: normaliseCondition(result.condition),
  };
};

export default parseCondition;
