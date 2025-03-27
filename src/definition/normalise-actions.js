import * as AclV2 from '../acl-v2.js';

const FROM_STATE_WILDCARD = '*';

export const normaliseCreateActions = (events) => Object.fromEntries(
  events.filter(isCreateAction)
        .map((event) => [event.id, normaliseCreate(event)])
);

export const normaliseUpdateActions = (events) => Object.fromEntries(
  events.filter(isUpdateAction)
        .map((event) => [event.id, normaliseUpdate(event)])
);

const isCreateAction = (event) => !event.pre_states?.length;

const isUpdateAction = (event) => event.pre_states?.length > 0;

const normaliseCreate = (event) => ({
  id: event.id,
  name: event.name,
  description: orUndefined(event.description),
  order: event.order,
  toState: event.post_state,
  postconditions: normalisePostconditions(event.postconditions),
  acl: AclV2.fromLegacy(event.acls),
  classification: event.security_classification,
  webhooks: {
    onStart: normaliseWebhook(event.callback_url_about_to_start_event, event.retries_timeout_about_to_start_event),
    onSubmit: normaliseWebhook(event.callback_url_about_to_submit_event, event.retries_timeout_url_about_to_submit_event),
    onSubmitted: normaliseWebhook(event.callback_url_submitted_event, event.retries_timeout_url_submitted_event),
  },
});

const normaliseUpdate = (event) => ({
  id: event.id,
  name: event.name,
  description: orUndefined(event.description),
  order: event.order,
  fromStates: normaliseFromStates(event.pre_states),
  precondition: orUndefined(event.precondition),
  toState: orUndefined(event.post_state),
  postconditions: normalisePostconditions(event.postconditions),
  acl: AclV2.fromLegacy(event.acls),
  classification: event.security_classification,
  webhooks: {
    onStart: normaliseWebhook(event.callback_url_about_to_start_event, event.retries_timeout_about_to_start_event),
    onSubmit: normaliseWebhook(event.callback_url_about_to_submit_event, event.retries_timeout_url_about_to_submit_event),
    onSubmitted: normaliseWebhook(event.callback_url_submitted_event, event.retries_timeout_url_submitted_event),
  },
});

const orUndefined = (value) => value ? value : undefined;

const normaliseFromStates = (fromStates) => {
  if (fromStates.includes(FROM_STATE_WILDCARD)) return;

  return fromStates;
}

/**
 * Preserve postconditions as an ordered array in case postconditions application order becomes important in the future.
 */
const normalisePostconditions = (postconditions) => {
  if (!postconditions?.length) return;

  return postconditions.map(({field_id, value}) => ({
    path: field_id,
    value,
  }));
};

const normaliseWebhook = (url, retries) => {
  if (!url) return;

  return {
    url,
    retries,
  };
};
