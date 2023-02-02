const disjunction = (leftDisjunctions, rightDisjunctions) => [...leftDisjunctions, ...rightDisjunctions];
const conjunction = (leftDisjunctions, rightDisjunctions) =>
  leftDisjunctions.flatMap((leftConjunctions) =>
    rightDisjunctions.map((rightConjunctions) => [...leftConjunctions, ...rightConjunctions])
  );

const isGroup = (groupOrCriteria) => groupOrCriteria instanceof Array;

const normalise = (groupOrCriteria) => {
  if (isGroup(groupOrCriteria)) {
    return normaliseCondition(groupOrCriteria);
  }

  // Single criteria disjunction
  return [[groupOrCriteria]];
}

/**
 * Transforms an N-dimensional parsed condition array with `AND` and `OR` operator into a 2-dimensional array
 * where the first dimension represents `OR` disjunctions, the second dimension represents `AND` conjunctions
 * and the items are the criteria themselves.
 *
 * @param {Array} condition n-dimensional array representing the parsed condition
 * @return {Array} 2-dimensional array representing a normalised and flatten condition
 */
const normaliseCondition = (condition) => {
  return condition.reduce((disjunctions, item, i) => {
    // Initialise disjunctions with first criteria
    if (i === 0) return normalise(item);

    // Skip all even items as they are criterias or subgroups
    if (i % 2 !== 1) return disjunctions;

    const operator = item === 'OR' ? disjunction : conjunction;
    const right = normalise(condition[i + 1]);
    return operator(disjunctions, right);
  }, [[]]);
};

export default normaliseCondition;