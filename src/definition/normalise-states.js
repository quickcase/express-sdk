import * as AclV2 from '../acl-v2.js';

const normaliseStates = (states) => Object.fromEntries(
  states.map((state) => [state.id, normalise(state)])
);

const normalise = (state) => ({
  id: state.id,
  name: state.name,
  description: orUndefined(state.description),
  title: orUndefined(state.title_display),
  order: state.order,
  ...normaliseAcl(state),
});

const orUndefined = (value) => value ? value : undefined;

const normaliseAcl = (state) => ({
  acl: AclV2.fromLegacy(state.acls),
});

export default normaliseStates;