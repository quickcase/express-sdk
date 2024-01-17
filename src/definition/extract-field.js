import {stateComparator} from './sort.js';

export const METADATA_START = '[';
const COLLECTION_ITEM_PATTERN = /^[^\[\]]+\[[^\[\]]*\]$/;

/**
 * Given normalised type and the path to a field, extract the definition of that field. When accessing case fields,
 * this approach should be preferred as a way to avoid hard references to case fields through the use of a fields map.
 * This also supports extracting metadata definitions as if they were standard fields with ACLs inherited from type.
 *
 * When a `checkAcl` function is provided as an option, the extractor only return items which passed the ACL check.
 * Items which did not pass the check will be returned as `undefined` (like if they didn't exist).
 *
 * <b>Please note: The extraction logic is written against normalised type definition.</b>
 *
 * @param {object} type - Normalised type definition
 * @param {object} opts - Optional config, for example use to provide suppliers for metadata options
 * @param {string|Array.<string>|object} path - One or many paths to a field using object notation.
 * @returns {any} Definition associated to field path if found, `undefined` if case has no data or path cannot be found
 */
const extractField = (type, opts = {}) => (path) => {
  const extractor = singleFieldExtractor(type, opts);
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

const extractMetadata = (type, path, opts) => {
  const metadata = path.slice(1, -1).toLowerCase();
  const {checkAcl, typeProvider, workspaceProvider} = opts;

  const commonDefinition = {
    type: 'metadata',
    acl: type.acl,
  };

  switch (metadata) {
    case 'workspace':
    case 'organisation': // Legacy
    case 'jurisdiction': // Legacy
      return {
        ...commonDefinition,
        id: '[workspace]',
        label: 'Workspace',
        options: workspaceProvider ? workspaceProvider().map(toOption) : [],
      };
    case 'type':
    case 'case_type': // Legacy
      return {
        ...commonDefinition,
        id: '[type]',
        label: 'Type',
        options: typeProvider ? typeProvider().map(toOption) : [],
      };
    case 'state':
      return {
        ...commonDefinition,
        id: '[state]',
        label: 'State',
        options: Object.values(type.states)
                       .filter((state) => !checkAcl || checkAcl(state.acl))
                       .sort(stateComparator())
                       .map(toOption),
      };
    case 'id':
    case 'reference':
    case 'case_reference': // Legacy
      return {
        ...commonDefinition,
        id: '[reference]',
        label: 'Reference',
      };
    case 'classification':
    case 'security_classification':
      return {
        ...commonDefinition,
        id: '[classification]',
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
        ...commonDefinition,
        id: '[created]',
        label: 'Created',
      };
    case 'modified':
    case 'last_modified':
      return {
        ...commonDefinition,
        id: '[lastModified]',
        label: 'Last modified',
      };
    default:
      return;
  }
};

const toOption = ({id, name}) => ({code: id, label: name});

const isMetadata = (path) => path[0] === METADATA_START;

const singleFieldExtractor = (type, opts) => (path) => {
  const field = isMetadata(path) ? extractMetadata(type, path, opts) : extract(type.fields, path.split('.'))

  if (!field) {
    return;
  }

  const {checkAcl} = opts;

  if (checkAcl && !checkAcl(field.acl)) {
    return;
  }

  return field;
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
