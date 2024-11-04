import * as AclV2 from '../acl-v2.js';
import {normaliseDisplay} from './utils/display.js';

/**
 * Normalises an array of fields returned as part of a case type by definition-store into a structure easier to consume.
 * This includes:
 * - Trimming all null/empty properties to reduce payloads
 * - Explicitly inheriting ACL from complex parents to their members and from collection to their content
 * - Applying ACL overrides on complex members and collection content
 * - Converting ACLs into objects of binary permissions (ACL v2)
 * - Sorting array elements with explicit `order` property and dropping the `order` property
 *
 * The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
 * consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
 * required any longer.
 *
 * @param {Array.<Object>} fields - Array of fields as returned by definition-store
 * @return {Object}
 */
const normaliseFields = (fields) => Object.fromEntries(
  fields.map((field) => [field.id, normalise(field)])
);

const normalise = (field) => ({
  id: field.id,
  label: field.label,
  hint: field.hint_text || undefined,
  ...normaliseType(field, field.field_type),
  ...normaliseDisplay(field),
  ...normaliseValidation(field.field_type),
  ...normaliseAcl(field),
  ...normaliseClassification(field),
  ...normaliseCondition(field),
});

const normaliseType = (field, fieldType) => {
  const type = fieldType.type.toLowerCase();

  switch (type) {
    case 'fixedlist':
    case 'multiselectlist':
      return {
        type,
        options: normaliseOptions(field.field_type.fixed_list_items),
      };
    case 'collection':
      return {
        type,
        content: normaliseContent(field, field.field_type.collection_field_type),
      };
    case 'complex':
      switch (fieldType.id) {
        case 'AddressGlobal':
        case 'AddressGlobalUK':
        case 'AddressUK':
          return {
            type,
            validation: undefined,
            members: mergeMemberDefaults(DEFAULTS_ADDRESS)(normaliseMembers(field, fieldType)),
          };
        default:
          return {
            type,
            members: normaliseMembers(field, fieldType),
          };
      }
    default:
      return {
        type,
      };
  }
};

const normaliseOptions = (options) => (options).sort((a, b) => a.order - b.order)
                                               .map(({code, label}) => ({code, label}));

const normaliseMembers = (field, fieldType) => {
  const addAcls = applyMemberAcls(field);

  const members = fieldType.complex_fields;

  return Object.fromEntries(
    members.map((member) => [member.id, normalise({...member, ...addAcls(member)})])
  );
};

const applyMemberAcls = (parent) => {
  let complexAcls = parent.complexACLs;

  // Transform array of complex ACLs into an object to avoid repetitive lookups
  if (Array.isArray(parent.complexACLs)) {
    if (complexAcls.length === 0) {
      complexAcls = null;
    } else {
      complexAcls = complexAcls.reduce((acc, acl) => {
        const key = acl.listElementCode;
        if (!acc[key]) {
          acc[key] = [acl];
        } else {
          acc[key] = [...acc[key], acl];
        }
        return acc;
      }, {});
    }
  }

  return (member) => {
    if (!complexAcls) {
      return {
        acls: parent.acls,
      };
    }

    if (!complexAcls[member.id]) {
      return {
        acls: [],
      };
    }

    return {
      acls: complexAcls[member.id],
      complexACLs: Object.fromEntries(
        Object.entries(complexAcls)
              .filter(([key]) => key.startsWith(member.id + '.'))
              .map(([key, value]) => [key.slice(member.id.length + 1), value])
      ),
    };
  };
};

const normaliseContent = (field, contentType) => ({
  ...normaliseType(field, contentType),
  ...normaliseValidation(contentType)
});

const normaliseValidation = (fieldType) => {
  if (!(fieldType.max || fieldType.min || fieldType.regular_expression)) {
    return {};
  }

  return {
    validation: {
      max: fieldType.max || undefined,
      min: fieldType.min || undefined,
      pattern: fieldType.regular_expression || undefined,
    },
  };
};

const normaliseAcl = (field) => ({
  acl: AclV2.fromLegacy(field.acls),
});

const normaliseClassification = (field) => ({
  classification: field.security_classification,
});

const normaliseCondition = (field) => {
  if (!field.show_condition) {
    return {};
  }

  return {
    condition: field.show_condition,
  };
};

const DEFAULTS_ADDRESS = {
  AddressLine1: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
  },
  AddressLine2: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
    validation: {
      required: false, // <-- Never required
    },
  },
  AddressLine3: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
    validation: {
      required: false, // <-- Never required
    },
  },
  PostTown: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
  },
  County: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
    validation: {
      required: false, // <-- Never required
    },
  },
  Country: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
  },
  PostCode: {
    display: {
      parameters: {
        withCharacterCount: 'false',
      },
    },
  },
};

/**
 * For pre-defined complex types, merge defaults missing from base type.
 */
const mergeMemberDefaults = (defaults) => (members) => Object.fromEntries(
  Object.entries(members)
        .map(([id, member]) => [id, {
          ...member,
          display: {
            mode: member.display?.mode || defaults[id]?.display.mode,
            parameters: {
              ...defaults[id]?.display?.parameters,
              ...member.display?.parameters,
            },
          },
          validation: {
            ...defaults[id]?.validation,
            ...member.validation,
          },
        }])
);

export default normaliseFields;
