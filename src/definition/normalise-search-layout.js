/**
 * Normalises the layout of the search inputs view.
 * This includes:
 * - Ordering fields and composite field members (removing need for `order` property)
 * - Explicitly populating layout of complex members from definition
 *
 * The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
 * consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
 * required any longer.
 */
import extractField from './extract-field.js';
import {fieldComparator} from './sort.js';

export const normaliseSearchInputsLayout = (definitionFields) => (layout) => {
  return {
    fields: layout.fields
                  .sort(fieldComparator())
                  .map(normaliseField(definitionFields)),
  };
};

export const normaliseSearchResultsLayout = (definitionFields) => (layout) => {};

const normaliseField = (definitionFields) => (field) => {
  const id = field.case_field_element_path ? `${field.case_field_id}.${field.case_field_element_path}` : field.case_field_id;

  const definitionField = extractField(definitionFields)(id);

  return {
    id,
    label: field.label || undefined,
    roles: field.role ? [field.role] : [],
    ...members(definitionField, field),
  };
};

const members = (definitionField, field) => {
  if (definitionField.type !== 'complex') {
    return {};
  }

  return {
    members: Object.values(definitionField.members)
                   .map(normaliseMember(definitionField.members)),
  };
};

const normaliseMember = (definitionFields) => (member) => {
  const definitionField = definitionFields[member.id];
  return {
    id: member.id,
    condition: member.condition,
    ...members(definitionField, member),
    // ...content(definitionField, member),
  };
};