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
import {Metadata} from '@quickcase/javascript-sdk';
import extractField from './extract-field.js';
import {fieldComparator} from './sort.js';
import {normaliseDisplay} from './utils/display.js';

export const normaliseSearchInputsLayout = (type) => (layout) => {
  const fieldExtractor = extractField(type);

  return {
    fields: layout.fields
                  .sort(fieldComparator())
                  .flatMap(normaliseField(fieldExtractor)),
  };
};

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
export const normaliseSearchResultsLayout = normaliseSearchInputsLayout;

const normaliseField = (fieldExtractor) => (field) => {
  const path = field.case_field_element_path ? `${field.field_path}.${field.case_field_element_path}` : field.field_path;
  const id = Metadata.isMetadata(path) ? Metadata.normaliseName(path) : path

  const definitionField = fieldExtractor(id);

  if (!definitionField) {
    // Drop field
    return [];
  }

  return [{
    id,
    label: field.label || undefined,
    roles: field.role ? [field.role] : [],
    ...normaliseDisplay(field),
    ...members(definitionField, field),
  }];
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
