import {fieldComparator, memberComparator, pageComparator} from './sort.js';
import {normaliseDisplay} from './utils/display.js';

/**
 * Normalises the layout of an action (steps and submit).
 * This includes:
 * - Ordering steps, columns, fields and composite field members (removing need for `order` property)
 * - Normalising step structure
 * - Normalising step fields
 * - Explicitly expanding the layout of composite fields without overrides from their definition (incl. member condition)
 * - Explicitly expanding the layout of composite fields with overrides from their overrides
 *
 * The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
 * consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
 * required any longer.
 *
 * @param {Object} definitionFields - Normalised field definitions, as per `Definition.normaliseFields()`
 * @param {Object} action - Non-normalised action, as returned by definition-store as part of case type
 * @param {Object} layout - Non-normalised layout, as returned by definition-store as wizard pages
 * @return {Object} Normalised steps for the action
 */
const normaliseActionLayout = (definitionFields) => (action, layout) => {
  const actionFields = Object.fromEntries(
    action.case_fields.map((field) => [field.case_field_id, field])
  );

  const steps = layout.wizard_pages
                      .sort(pageComparator())
                      .map(normaliseStep(definitionFields, actionFields));

  return {
    steps,
    submit: {
      buttonLabel: action.end_button_label || undefined,
      note: action.show_event_notes || undefined,
      checkAnswers: action.show_summary,
    },
  };
};

const normaliseStep = (definitionFields, actionFields) => (page) => {
  const reduceNormalisedField = reduceField(normaliseField(definitionFields, actionFields));
  const {fields, columns} = page.wizard_page_fields
                                .sort(fieldComparator())
                                .reduce(reduceNormalisedField, {fields: [], columns: {}});

  return {
    id: page.id,
    label: page.label,
    condition: page.show_condition || undefined,
    fields,
    columns: Object.values(columns)
  };
}

const reduceField = (transformField) => (structure, pageField) => {
  const colKey = pageField.page_column_no;
  const transformedField = transformField(pageField);

  if (colKey === undefined || colKey === null) {
    return {
      ...structure,
      fields: [
        ...structure.fields,
        transformedField,
      ],
    };
  }

  const col = structure.columns[colKey];

  return {
    ...structure,
    columns: {
      ...structure.columns,
      [colKey]: {
        id: String(colKey),
        fields: [
          ...(col ? col.fields : []),
          transformedField,
        ],
      },
    },
  };
};

const normaliseField = (definitionFields, actionFields) => (pageField) => {
  const id = pageField.case_field_id;
  const definitionField = definitionFields[id];
  const actionField = actionFields[id];

  return {
    id,
    label: actionField.label || undefined,
    hint: actionField.hint_text || undefined,
    use: actionField.display_context,
    condition: actionField.show_condition || undefined,
    ...normaliseDisplay(actionField),
    ...members(definitionField, actionField),
    ...content(definitionField, actionField),
    ...noCheck(actionField),
  }
};

const members = (definitionField, actionField) => {
  if (definitionField.type === 'complex') {
    if (actionField.case_fields_complex && actionField.case_fields_complex.length) {
      return {
        members: membersFromOverrides(definitionField, actionField.case_fields_complex),
      };
    }

    return {
      members: membersFromDefinition(definitionField, actionField.display_context),
    };
  }

  return {};
};

const membersFromDefinition = (complexDefinition, complexUse) =>
  Object.values(complexDefinition.members)
        .map((member) => {
          const memberDefinition = complexDefinition.members[member.id];

          return {
            id: member.id,
            use: complexUse,
            condition: member.condition,
            ...(memberDefinition.type === 'complex' ? {
              members: membersFromDefinition(memberDefinition, complexUse),
            } : {}),
            ...(memberDefinition.type === 'collection' ? {
              content: {
                members: membersFromDefinition(memberDefinition.content, complexUse),
              },
            } : {}),
          };
        });

const membersFromOverrides = (complexDefinition, overrides) => {
  const membersByPath = overrides.sort(memberComparator())
                                 .reduce((acc, member) => {
                                   const lastDotIndex = member.reference.lastIndexOf('.');
                                   const path = lastDotIndex > 0 ? member.reference.slice(0, lastDotIndex) : '';
                                   const id = lastDotIndex > 0 ? member.reference.slice(lastDotIndex + 1) : member.reference;
                                   return {
                                     ...acc,
                                     [path]: [
                                       ...(acc[path] || []),
                                       id,
                                     ],
                                   };
                                 }, {});
  const indexedOverrides = Object.fromEntries(
    overrides.map((override) => [override.reference, override])
  );

  const overrideMembers = (parentDefinition, parentPath) => membersByPath[parentPath].map((id) => {
    const path = parentPath ? parentPath + '.' + id : id;
    const memberDefinition = parentDefinition.members[id];
    const override = indexedOverrides[path];

    if (memberDefinition.type === 'complex' && membersByPath[path]) {
      return {
        id,
        ...normaliseOverride(override),
        members: overrideMembers(memberDefinition, path),
      };
    }

    if (memberDefinition.type === 'collection' && memberDefinition.content.type === 'complex' && membersByPath[path]) {
      return {
        id,
        ...normaliseOverride(override),
        content: {
          members: overrideMembers(memberDefinition.content, path),
        },
      };
    }

    return {
      id,
      ...normaliseOverride(override),
    };
  });

  return overrideMembers(complexDefinition, '');
}

const normaliseOverride = (override) => ({
  label: override.label || undefined,
  hint: override.hint || undefined,
  use: override.displayContext,
  condition: override.showCondition || undefined,
  ...normaliseDisplay(override),
});

const content = (definitionField, actionField) => {
  if (definitionField.type === 'collection' && definitionField.content.type === 'complex') {
    if (actionField.case_fields_complex && actionField.case_fields_complex.length) {
      return {
        content: {
          members: membersFromOverrides(definitionField.content, actionField.case_fields_complex),
        },
      };
    }

    return {
      content: {
        members: membersFromDefinition(definitionField.content, actionField.display_context),
      },
    };
  }

  return {};
};

const noCheck = (actionField) => {
  if (!actionField.show_summary_change_option) {
    return {noCheck: true};
  }

  return {};
};

export default normaliseActionLayout;
