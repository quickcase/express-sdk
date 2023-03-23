export const FIELD_PATH_PATTERN = /^(?:@\.)?[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/;
const METADATA_START = '[';
const COLLECTION_ITEM_PATTERN = /^(?<name>[^\[\]]+)(?:\[(?:(?<colIndex>\d+)|id:(?<colId>[^\[\]]+))\])?$/;
const RELATIVE_PREFIX_PATTERN = /^@/;
const RELATIVE_PREFIX_AND_DOT_PATTERN = /^@\./;

/**
 * Given a record and the path to a field, extract the value of that field. When accessing case fields, this approach should
 * be preferred as a way to avoid hard references to case fields through the use of a fields map.
 * This also supports extracting metadata.
 * <b>Please note: The extraction logic is written against data-store's API contract.</b>
 *
 * @param {object} record - Record from which the field value should be extracted
 * @param {string|Array.<string>|object} path - One or many paths to a field using object notation.
 * @returns {any} Value associated to field path if found, `undefined` if case has no data or path cannot be found
 */
const rootExtractor = (record) => (path) => {
  const extractor = singleFieldExtractor(record);
  if (typeof path === 'string') {
    return extractor(path);
  } else if(Array.isArray(path)) {
    return arrayFieldExtractor(extractor)(path);
  } else if(typeof path === 'object' && path !== null) {
    return objectFieldExtractor(extractor)(path);
  } else {
    throw `Unsupported path '${path}' of type ${typeof path}`;
  }
};

const singleFieldExtractor = (record) => (path) => {
  if (path[0] === METADATA_START) {
    return metadataExtractor(record)(path);
  }

  // Trim unresolved relative prefix
  path = path.replace(RELATIVE_PREFIX_AND_DOT_PATTERN, '');

  const caseData = dataExtractor(record);
  return caseData ? field(caseData)(path.split('.').map(parsePathElement)) : undefined;
};

const metadataExtractor = (record) => (path) => {
  const metadata = path.slice(1, -1).toLowerCase();
  switch (metadata) {
    case 'workspace':
    case 'organisation': // Legacy
    case 'jurisdiction': // Legacy
      return record.jurisdiction;
    case 'type':
    case 'case_type': // Legacy
      return record.case_type_id;
    case 'state':
      return record.state;
    case 'id':
    case 'reference':
    case 'case_reference': // Legacy
      return record.id;
    case 'classification':
    case 'security_classification':
      return record.security_classification;
    case 'created':
    case 'created_date': // Legacy
      return record.created_date;
    case 'modified':
    case 'last_modified':
      return record.last_modified;
    default:
      return;
  }
};

const parsePathElement = (pathElement) => {
  const match = COLLECTION_ITEM_PATTERN.exec(pathElement);
  return match ? match.groups : pathElement;
};

const arrayFieldExtractor = (extractor) => (paths) => paths.map(extractor);

const objectFieldExtractor = (extractor) => (paths) => Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [key, extractor(path)])
);

/**
 * Handle the fact that legacy search endpoint return cases with data under `case_data` while others endpoints return data under `data`.
 * While provided for convenience, function `fieldExtractor` should be preferred to avoid hard references to fields.
 *
 * @param record Record from which the data should be retrieved.
 * @returns {object} data property of the given case
 */
const dataExtractor = (record) => record && (record.data || record.case_data);

const field = (from) => (pathElements) => {
  const [nextElement, ...remainingElements] = pathElements;
  const nextValue = extractNextElement(from, nextElement);

  if (remainingElements && remainingElements.length > 0) {
    return field(nextValue)(remainingElements);
  } else {
    return nextValue;
  }
};

const isObjectWithKey = (obj, key) => obj && typeof obj === 'object' && Object.keys(obj).includes(key);

const extractCollectionItem = (collection, {colIndex, colId}) => {
  if (!Array.isArray(collection)) {
    return undefined;
  }

  if (colId) {
    return collection.find((item) => item.id === colId);
  }

  return collection[parseInt(colIndex)];
};

const extractNextElement = (from, {name, colIndex, colId}) => {
  if (isObjectWithKey(from, name)) {
    const nextValue = from[name];

    if (colIndex || colId) {
      return extractCollectionItem(nextValue, {colIndex, colId});
    }

    return nextValue;
  }
};

/**
 * Decorates a root extractor with relative path resolution.
 *
 * @param extractor Extractor being decorated, usually the root extractor
 * @param basePath The path from which relative paths are resolved
 * @return {function(string|Array.<string>|object): any} Extract function
 */
export const relativeExtractor = (extractor, basePath) => (path) => {
  const makeAbsolute = (i) => i.replace(RELATIVE_PREFIX_PATTERN, basePath)

  if (typeof path === 'string') {
    path = makeAbsolute(path);
  } else if(Array.isArray(path)) {
    path = path.map(makeAbsolute);
  } else if(typeof path === 'object' && path !== null) {
    path = Object.fromEntries(
      Object.entries(path).map(([key, value]) => [key, makeAbsolute(value)])
    );
  }

  return extractor(path);
};

export default rootExtractor;