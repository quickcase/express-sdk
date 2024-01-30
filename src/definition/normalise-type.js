import * as AclV2 from '../acl-v2.js';
import normaliseFields from './normalise-fields.js';
import normaliseStates from './normalise-states.js';

/**
 * Normalises schema, workflow and security parts of a type definition (ie. everything but layouts).
 *
 * The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
 * consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
 * required any longer.
 *
 * @param {object} type - Raw type definition returned by definition-store API v3.
 * @return {object} Normalised type definition
 */
const normaliseType = (type) => ({
  id: type.id,
  name: type.name,
  description: type.description,
  title: type.titleDisplay,
  acl: AclV2.fromLegacy(type.acls),
  events: {}, // TODO once normalisation of events implemented
  fields: normaliseFields(type.case_fields),
  states: normaliseStates(type.states),
});

export default normaliseType;