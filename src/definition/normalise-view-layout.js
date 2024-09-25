import {fieldComparator, tabComparator} from './sort.js';
import {normaliseDisplay} from './utils/display.js';

/**
 * Normalises the layout of the record view (tabs).
 * This includes:
 * - Ordering groups, fields and composite field members (removing need for `order` property)
 * - Normalising group structure
 * - Normalising group fields
 * - Explicitly expanding the layout of composite fields without overrides from their definition (incl. member condition)
 *
 * The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
 * consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
 * required any longer.
 */
const normaliseViewLayout = (definitionFields) => (layout) => ({
  groups: layout.tabs
                .sort(tabComparator())
                .map(normaliseTab(definitionFields)),
});

const normaliseTab = (definitionFields) => (tab) => ({
  id: tab.id,
  label: tab.label,
  roles: tab.role ? [tab.role] : [],
  condition: tab.show_condition || undefined,
  fields: tab.tab_fields
             .sort(fieldComparator())
             .map(normaliseField(definitionFields)),
});

const normaliseField = (definitionFields) => (tabField) => {
  const definitionField = definitionFields[tabField.case_field.id];
  return {
    id: tabField.case_field.id,
    condition: tabField.show_condition || undefined,
    ...normaliseDisplay(tabField),
    ...members(definitionField, tabField),
    ...content(definitionField, tabField),
  };
};

const members = (definitionField, tabField) => {
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
    ...content(definitionField, member),
  };
};

const content = (definitionField, tabField) => {
  if (definitionField.type !== 'collection' || definitionField.content.type !== 'complex') {
    return {};
  }

  return {
    content: {
      members: Object.values(definitionField.content.members)
                     .map(normaliseMember(definitionField.content.members))
    },
  };
};

export default normaliseViewLayout;
