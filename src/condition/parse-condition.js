import extractTokens from './extract-tokens';
import normaliseCondition from './normalise-condition';
import parseTokens from './parse-tokens';

const parseCondition = (conditionString) => normaliseCondition(parseTokens(extractTokens(conditionString)));

export default parseCondition;