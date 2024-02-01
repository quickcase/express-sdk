import {Metadata} from '@quickcase/javascript-sdk';
import {stateComparator} from './sort.js';

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
  const {checkAcl, typeProvider, workspaceProvider} = opts;

  const commonDefinition = {
    type: 'metadata',
    acl: type.acl,
  };

  const id = Metadata.normaliseName(path);

  switch (id) {
    case Metadata.WORKSPACE:
      return {
        ...commonDefinition,
        id,
        label: 'Workspace',
        options: workspaceProvider ? workspaceProvider().map(toOption) : [],
      };
    case Metadata.TYPE:
      return {
        ...commonDefinition,
        id,
        label: 'Type',
        options: typeProvider ? typeProvider().map(toOption) : [],
      };
    case Metadata.STATE:
      return {
        ...commonDefinition,
        id,
        label: 'State',
        options: Object.values(type.states)
                       .filter((state) => !checkAcl || checkAcl(state.acl))
                       .sort(stateComparator())
                       .map(toOption),
      };
    case Metadata.ID:
      return {
        ...commonDefinition,
        id,
        label: 'Reference',
      };
    case Metadata.CLASSIFICATION:
      return {
        ...commonDefinition,
        id,
        label: 'Classification',
        options: [
          {code: 'PUBLIC', label: 'Public'},
          {code: 'PRIVATE', label: 'Private'},
          {code: 'RESTRICTED', label: 'Restricted'},
        ],
      };
    case Metadata.CREATED_AT:
      return {
        ...commonDefinition,
        id,
        label: 'Created',
      };
    case Metadata.LAST_MODIFIED_AT:
      return {
        ...commonDefinition,
        id,
        label: 'Last modified',
      };
    default:
      return;
  }
};

const toOption = ({id, name}) => ({code: id, label: name});

const singleFieldExtractor = (type, opts) => (path) => {
  const field = Metadata.isMetadata(path) ? extractMetadata(type, path, opts) : extract(type.fields, path.split('.'))

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
