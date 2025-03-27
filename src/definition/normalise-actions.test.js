import * as AclV2 from '../acl-v2.js';
import {normaliseCreateActions, normaliseUpdateActions} from './normalise-actions.js';

const CR = AclV2.CREATE | AclV2.READ;

describe('normaliseCreateActions', () => {
  const actions = [
    {
      id: 'action1',
      name: 'Create action 1',
      description: 'A first create action',
      order: 1,
      pre_states: [],
      post_state: 'state1',
      acls: [
        {
          role: 'caseworker-test-write',
          create: true,
          read: true,
        },
        {
          role: 'caseworker-test-read',
          create: false,
          read: true,
        }
      ],
      security_classification: 'PUBLIC',
    },
    {
      id: 'action2',
      name: 'Create action 2',
      description: null,
      order: 2,
      pre_states: [],
      post_state: 'state2',
      postconditions: [
        {field_id: 'field1', value: 'value1'},
        {field_id: 'field2', value: 'value2'},
      ],
      acls: [
        {
          role: 'caseworker-test-write',
          create: true,
          read: false,
        }
      ],
      security_classification: 'PRIVATE',
      callback_url_about_to_start_event: 'http://webhooks/start',
      retries_timeout_about_to_start_event: [1,2,3],
      callback_url_about_to_submit_event: 'http://webhooks/submit',
      retries_timeout_url_about_to_submit_event: [4,5,6],
      callback_url_submitted_event: 'http://webhooks/submitted',
      retries_timeout_url_submitted_event: [7,8,9],
    },
  ];

  test('should return empty object when no actions', () => {
    expect(normaliseCreateActions([])).toEqual({});
  });

  test('should transform array of events into object of normalised create actions', () => {
    expect(normaliseCreateActions(actions)).toEqual({
      'action1': {
        id: 'action1',
        name: 'Create action 1',
        description: 'A first create action',
        order: 1,
        toState: 'state1',
        acl: {
          'caseworker-test-write': CR,
          'caseworker-test-read': AclV2.READ,
        },
        classification: 'PUBLIC',
        webhooks: {},
      },
      'action2': {
        id: 'action2',
        name: 'Create action 2',
        order: 2,
        toState: 'state2',
        postconditions: [
          {path: 'field1', value: 'value1'},
          {path: 'field2', value: 'value2'},
        ],
        acl: {
          'caseworker-test-write': AclV2.CREATE,
        },
        classification: 'PRIVATE',
        webhooks: {
          onStart: {
            url: 'http://webhooks/start',
            retries: [1,2,3]
          },
          onSubmit: {
            url: 'http://webhooks/submit',
            retries: [4,5,6]
          },
          onSubmitted: {
            url: 'http://webhooks/submitted',
            retries: [7,8,9]
          },
        },
      },
    });
  });

  test('should filter out update actions', () => {
    const createActions = normaliseCreateActions([
      ...actions,
      {
        id: 'updateAction1',
        name: 'Update action',
        pre_states: ['state1'],
        acls: [],
      }
    ]);

    expect(createActions).not.toHaveProperty('updateAction1');
  });
});

describe('normaliseUpdateActions', () => {
  const actions = [
    {
      id: 'action1',
      name: 'Update action 1',
      description: 'A first update action',
      order: 1,
      pre_states: ['*'],
      precondition: 'field1 EQUALS "value1"',
      post_state: 'state1',
      postconditions: [],
      acls: [
        {
          role: 'caseworker-test-write',
          create: true,
          read: true,
        },
        {
          role: 'caseworker-test-read',
          create: false,
          read: true,
        }
      ],
      security_classification: 'PUBLIC',
    },
    {
      id: 'action2',
      name: 'Update action 2',
      description: null,
      order: 2,
      pre_states: ['state1', 'state3'],
      precondition: null,
      post_state: 'state2',
      postconditions: [
        {field_id: 'field1', value: 'value1'},
        {field_id: 'field2', value: 'value2'},
      ],
      acls: [
        {
          role: 'caseworker-test-write',
          create: true,
          read: false,
        }
      ],
      security_classification: 'PRIVATE',
      callback_url_about_to_start_event: 'http://webhooks/start',
      retries_timeout_about_to_start_event: [1,2,3],
      callback_url_about_to_submit_event: 'http://webhooks/submit',
      retries_timeout_url_about_to_submit_event: [4,5,6],
      callback_url_submitted_event: 'http://webhooks/submitted',
      retries_timeout_url_submitted_event: [7,8,9],
    },
  ];

  test('should return empty object when no actions', () => {
    expect(normaliseUpdateActions([])).toEqual({});
  });

  test('should transform array of events into object of normalised update actions', () => {
    expect(normaliseUpdateActions(actions)).toEqual({
      'action1': {
        id: 'action1',
        name: 'Update action 1',
        description: 'A first update action',
        order: 1,
        fromStates: undefined,
        precondition: 'field1 EQUALS "value1"',
        toState: 'state1',
        acl: {
          'caseworker-test-write': CR,
          'caseworker-test-read': AclV2.READ,
        },
        classification: 'PUBLIC',
        webhooks: {},
      },
      'action2': {
        id: 'action2',
        name: 'Update action 2',
        order: 2,
        fromStates: ['state1', 'state3'],
        toState: 'state2',
        postconditions: [
          {path: 'field1', value: 'value1'},
          {path: 'field2', value: 'value2'},
        ],
        acl: {
          'caseworker-test-write': AclV2.CREATE,
        },
        classification: 'PRIVATE',
        webhooks: {
          onStart: {
            url: 'http://webhooks/start',
            retries: [1,2,3]
          },
          onSubmit: {
            url: 'http://webhooks/submit',
            retries: [4,5,6]
          },
          onSubmitted: {
            url: 'http://webhooks/submitted',
            retries: [7,8,9]
          },
        },
      },
    });
  });

  test('should filter out update actions', () => {
    const createActions = normaliseUpdateActions([
      ...actions,
      {
        id: 'createAction1',
        name: 'Create action',
        pre_states: [],
        acls: [],
      }
    ]);

    expect(createActions).not.toHaveProperty('createAction1');
  });
});
