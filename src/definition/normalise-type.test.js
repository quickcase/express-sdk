import {CRUD, READ} from '../acl-v2.js';
import normaliseType from './normalise-type.js';

test('should normalise simple type with no events/fields/states', () => {
  const rawType = {
    id: 'type1',
    name: 'Type 1',
    description: 'Description for type 1',
    acls: [],
    events: [],
    case_fields: [],
    states: [],
  };

  expect(normaliseType(rawType)).toEqual({
    id: 'type1',
    name: 'Type 1',
    description: 'Description for type 1',
    acl: {},
    events: {},
    fields: {},
    states: {},
  });
});

test('should normalise ACLs', () => {
  const rawType = {
    id: 'type1',
    name: 'Type 1',
    acls: [
      {
        "role": "role-1",
        "create": true,
        "read": true,
        "update": true,
        "delete": true,
      },
      {
        "role": "role-2",
        "create": false,
        "read": true,
        "update": false,
        "delete": false,
      },
    ],
    events: [],
    case_fields: [],
    states: [],
  };

  expect(normaliseType(rawType)).toEqual({
    id: 'type1',
    name: 'Type 1',
    acl: {
      'role-1': CRUD,
      'role-2': READ,
    },
    events: {},
    fields: {},
    states: {},
  });
});

test('should normalise fields', () => {
  const rawType = {
    id: 'type1',
    name: 'Type 1',
    acls: [],
    events: [],
    case_fields: [
      {
        metadata: false,
        id: 'textField1',
        case_type_id: 'UI_TEST',
        label: 'Text field 1',
        hint_text: 'This is a hint for text field 1',
        field_type: {
          id: 'Text',
          type: 'Text',
        },
        security_classification: 'PUBLIC',
        acls: [
          {
            role: 'role-1',
            create: true,
            read: true,
            update: true,
            delete: true
          }
        ],
      }
    ],
    states: [],
  };

  expect(normaliseType(rawType)).toEqual({
    id: 'type1',
    name: 'Type 1',
    acl: {},
    events: {},
    fields: {
      'textField1': {
        id: 'textField1',
        label: 'Text field 1',
        hint: 'This is a hint for text field 1',
        type: 'text',
        classification: 'PUBLIC',
        acl: {
          'role-1': CRUD,
        },
      },
    },
    states: {},
  });
});

test('should normalise states', () => {
  const rawType = {
    id: 'type1',
    name: 'Type 1',
    acls: [],
    events: [],
    case_fields: [],
    states: [
      {
        id: 'created',
        name: 'Created',
        description: 'Freshly created instance',
        order: 1,
        title_display: '{{textField1}}',
        acls: [
          {
            role: 'role-1',
            create: true,
            read: true,
            update: true,
            delete: true
          }
        ]
      }
    ],
  };

  expect(normaliseType(rawType)).toEqual({
    id: 'type1',
    name: 'Type 1',
    acl: {},
    events: {},
    fields: {},
    states: {
      'created': {
        id: 'created',
        name: 'Created',
        description: 'Freshly created instance',
        order: 1,
        title: '{{textField1}}',
        acl: {
          'role-1': CRUD,
        },
      }
    },
  });
});
