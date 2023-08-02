const METADATA_START = '[';
const COLLECTION_ITEM_PATTERN = /^[^\[\]]+\[[^\[\]]*\]$/;

/**
 * Given normalised fields and the path to a field, extract the definition of that field. When accessing case fields,
 * this approach should be preferred as a way to avoid hard references to case fields through the use of a fields map.
 * This also supports extracting metadata.
 * <b>Please note: The extraction logic is written against normalised field definitions.</b>
 *
 * @param {object} normalisedFields - Normalised field definitions, indexed by top-level field ID
 * @param {object} opts - Optional config, for example use to provide suppliers for metadata options
 * @param {string|Array.<string>|object} path - One or many paths to a field using object notation.
 * @returns {any} Definition associated to field path if found, `undefined` if case has no data or path cannot be found
 */
const extractField = (normalisedFields, opts = {}) => (path) => {
  const extractor = singleFieldExtractor(normalisedFields, opts);
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

const extractMetadata = (path, providers) => {
  const metadata = path.slice(1, -1).toLowerCase();
  const {stateProvider, typeProvider, workspaceProvider} = providers;

  switch (metadata) {
    case 'workspace':
    case 'organisation': // Legacy
    case 'jurisdiction': // Legacy
      return {
        id: '[workspace]',
        type: 'metadata',
        label: 'Workspace',
        options: workspaceProvider ? workspaceProvider().map(toOption) : [],
      };
    case 'type':
    case 'case_type': // Legacy
      return {
        id: '[type]',
        type: 'metadata',
        label: 'Type',
        options: typeProvider ? typeProvider().map(toOption) : [],
      };
    case 'state':
      return {
        id: '[state]',
        type: 'metadata',
        label: 'State',
        options: stateProvider ? stateProvider().map(toOption) : [],
      };
    case 'id':
    case 'reference':
    case 'case_reference': // Legacy
      return {
        id: '[reference]',
        type: 'metadata',
        label: 'Reference',
      };
    case 'classification':
    case 'security_classification':
      return {
        id: '[classification]',
        type: 'metadata',
        label: 'Classification',
        options: [
          {code: 'PUBLIC', label: 'Public'},
          {code: 'PRIVATE', label: 'Private'},
          {code: 'RESTRICTED', label: 'Restricted'},
        ],
      };
    case 'created':
    case 'created_date': // Legacy
      return {
        id: '[created]',
        type: 'metadata',
        label: 'Created',
      };
    case 'modified':
    case 'last_modified':
      return {
        id: '[lastModified]',
        type: 'metadata',
        label: 'Last modified',
      };
    default:
      return;
  }
};

const toOption = ({id, name}) => ({code: id, label: name});

const singleFieldExtractor = (fields, opts) => (path) => {
  if (path[0] === METADATA_START) {
    return extractMetadata(path, opts);
  }

  const elements = path.split('.');
  return extract(fields, elements);
};

const arrayFieldExtractor = (extractor) => (paths) => paths.map(extractor);

const objectFieldExtractor = (extractor) => (paths) => Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [key, extractor(path)])
);

const extract = (fields, elements) => {
  const [head, ...tail] = elements;

  const definition = findDefinition(fields, head);

  if (!definition) {
    return;
  }

  if (tail.length === 0) {
    return definition;
  }

  return extract(definition.members, tail);
};

const findDefinition = (fields, id) => {
  if (COLLECTION_ITEM_PATTERN.test(id)) {
    const collectionId = id.replace(/\[.*$/, '');
    const collectionDefinition = fields[collectionId];

    if (!collectionDefinition || !collectionDefinition.content) {
      return;
    }

    return {
      members: {
        value: collectionDefinition.content,
      },
    };
  }

  return fields[id];
};

export default extractField;