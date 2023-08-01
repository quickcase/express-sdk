import * as AclV2 from '../acl-v2.js';
import normaliseStates from './normalise-states.js';

const CRUD = AclV2.CREATE | AclV2.READ | AclV2.UPDATE | AclV2.DELETE;
const CU = AclV2.CREATE | AclV2.UPDATE;

const states = [
  {
    id: 'state1',
    name: 'State 1',
    description: 'Initial state after creation',
    order: 1,
    title_display: null,
    acls: [
      {
        role: 'caseworker-test-write',
        create: true,
        read: true,
        update: true,
        delete: true
      },
      {
        role: 'caseworker-test-read',
        create: false,
        read: true,
        update: false,
        delete: false
      }
    ]
  },
  {
    id: 'state2',
    name: 'State 2',
    description: null,
    order: 2,
    title_display: '{{field1}} {{field2}}',
    acls: [
      {
        role: 'caseworker-test-write',
        create: true,
        read: false,
        update: true,
        delete: false
      }
    ]
  },
];

test('should return empty object when no states', () => {
  expect(normaliseStates([])).toEqual({});
});

test('should transform array of states into object of normalised states', () => {
  expect(normaliseStates(states)).toEqual({
    'state1': {
      id: 'state1',
      name: 'State 1',
      description: 'Initial state after creation',
      order: 1,
      acl: {
        'caseworker-test-write': CRUD,
        'caseworker-test-read': AclV2.READ,
      },
    },
    'state2': {
      id: 'state2',
      name: 'State 2',
      title: '{{field1}} {{field2}}',
      order: 2,
      acl: {
        'caseworker-test-write': CU,
      },
    },
  });
});
