import * as AclV2 from '../acl-v2.js';
import normaliseFields from './normalise-fields.js';

const CRUD = AclV2.CRUD;
const CR = AclV2.CREATE | AclV2.READ;
const CRU = AclV2.CREATE | AclV2.READ | AclV2.UPDATE;
const RU = AclV2.READ | AclV2.UPDATE;

test('should transform array of fields into object of normalised fields', () => {
  const fields = [
    textField,
    fixedListField,
  ];

  expect(normaliseFields(fields)).toEqual({
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
    'choice1': {
      id: 'choice1',
      label: 'Choice 1',
      type: 'fixedlist',
      options: [
        {code: 'option1', label: 'Option 1'},
        {code: 'option2', label: 'Option 2'},
        {code: 'option3', label: 'Option 3'},
        {code: 'option4', label: 'Option 4'},
        {code: 'option5', label: 'Option 5'},
      ],
      classification: 'PRIVATE',
      acl: {
        'role-2': AclV2.READ,
      },
    },
  });
});

test('should normalise validation properties', () => {
  const fields = [
    {
      ...textField,
      field_type: {
        ...textField.field_type,
        min: '3',
        max: '9',
        regular_expression: '^abc',
      },
    },
  ];

  expect(normaliseFields(fields)).toEqual({
    'textField1': {
      id: 'textField1',
      label: 'Text field 1',
      hint: 'This is a hint for text field 1',
      type: 'text',
      classification: 'PUBLIC',
      acl: {
        'role-1': CRUD,
      },
      validation: {
        min: '3',
        max: '9',
        pattern: '^abc',
      }
    },
  });
});

test('should normalise show conditions', () => {
  const fields = [
    {
      ...textField,
      show_condition: '[state] == "Open"'
    },
  ];

  expect(normaliseFields(fields)).toEqual({
    'textField1': {
      id: 'textField1',
      label: 'Text field 1',
      hint: 'This is a hint for text field 1',
      type: 'text',
      classification: 'PUBLIC',
      acl: {
        'role-1': CRUD,
      },
      condition: '[state] == "Open"'
    },
  });
});

test('should recursively normalise complex members and inherit acl from parent when no complex ACLs', () => {
  const fields = [
    complexApplicantField,
  ];

  expect(normaliseFields(fields)).toEqual({
    'applicant': {
      id: 'applicant',
      label: 'Applicant',
      hint: 'The individual on behalf of who this record is created',
      type: 'complex',
      classification: 'PUBLIC',
      acl: {
        'role-1': RU,
      },
      members: {
        firstName: {
          id: 'firstName',
          label: 'First name',
          type: 'text',
          validation: {
            max: '32',
          },
          classification: 'PUBLIC',
          acl: {
            'role-1': RU,
          },
        },
        lastName: {
          id: 'lastName',
          label: 'Last name',
          type: 'text',
          validation: {
            max: '32',
          },
          classification: 'PUBLIC',
          acl: {
            'role-1': RU,
          },
        },
        birth: {
          id: 'birth',
          label: 'Date of birth',
          type: 'date',
          classification: 'PUBLIC',
          acl: {
            'role-1': RU,
          },
        },
        address: {
          id: 'address',
          label: 'Address',
          type: 'complex',
          classification: 'PUBLIC',
          acl: {
            'role-1': RU,
          },
          members: {
            line1: {
              id: 'line1',
              label: 'Line 1',
              type: 'text',
              classification: 'PUBLIC',
              acl: {
                'role-1': RU,
              },
            },
            line2: {
              id: 'line2',
              label: 'Line 2',
              type: 'text',
              classification: 'PUBLIC',
              acl: {
                'role-1': RU,
              },
            },
            postcode: {
              id: 'postcode',
              label: 'Postcode',
              type: 'text',
              classification: 'PUBLIC',
              acl: {
                'role-1': RU,
              },
              validation: {
                min: '6',
              }
            },
          },
        },
      }
    },
  });
});

test('should apply complex ACLs to members when defined and drop ACLs for any member with implicit ACLs', () => {
  const fields = [
    {
      ...complexApplicantField,
      acls: [
        {role: 'role-1', create: true, read: true, update: true, delete: true},
        {role: 'role-2', create: false, read: true, update: false, delete: false},
      ],
      complexACLs: [
        {role: 'role-1', create: true, read: true, update: false, delete: false, listElementCode: 'firstName'},
        {role: 'role-1', create: true, read: true, update: false, delete: false, listElementCode: 'lastName'},
        {role: 'role-1', create: true, read: true, update: true, delete: false, listElementCode: 'address'},
        {role: 'role-1', create: false, read: true, update: true, delete: false, listElementCode: 'address.postcode'},
        {role: 'role-2', create: false, read: true, update: false, delete: false, listElementCode: 'firstName'},
      ],
    },
  ];

  expect(normaliseFields(fields)).toEqual({
    'applicant': {
      id: 'applicant',
      label: 'Applicant',
      hint: 'The individual on behalf of who this record is created',
      type: 'complex',
      classification: 'PUBLIC',
      acl: {
        'role-1': CRUD,
        'role-2': AclV2.READ,
      },
      members: {
        firstName: {
          id: 'firstName',
          label: 'First name',
          type: 'text',
          validation: {
            max: '32',
          },
          classification: 'PUBLIC',
          acl: {
            'role-1': CR,
            'role-2': AclV2.READ,
          },
        },
        lastName: {
          id: 'lastName',
          label: 'Last name',
          type: 'text',
          validation: {
            max: '32',
          },
          classification: 'PUBLIC',
          acl: {
            'role-1': CR,
          },
        },
        birth: {
          id: 'birth',
          label: 'Date of birth',
          type: 'date',
          classification: 'PUBLIC',
          acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
        },
        address: {
          id: 'address',
          label: 'Address',
          type: 'complex',
          classification: 'PUBLIC',
          acl: {
            'role-1': CRU,
          },
          members: {
            line1: {
              id: 'line1',
              label: 'Line 1',
              type: 'text',
              classification: 'PUBLIC',
              acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
            },
            line2: {
              id: 'line2',
              label: 'Line 2',
              type: 'text',
              classification: 'PUBLIC',
              acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
            },
            postcode: {
              id: 'postcode',
              label: 'Postcode',
              type: 'text',
              classification: 'PUBLIC',
              acl: {
                'role-1': RU,
              },
              validation: {
                min: '6',
              }
            },
          },
        },
      }
    },
  });
});

test('should recursively normalise collection of complex members and inherit acl from parent when no complex ACLs', () => {
  const fields = [
    collectionIndividualsField,
  ];

  expect(normaliseFields(fields)).toEqual({
    'individuals': {
      id: 'individuals',
      label: 'Individuals',
      type: 'collection',
      classification: 'PUBLIC',
      acl: {
        'role-1': RU,
      },
      content: {
        type: 'complex',
        members: {
          firstName: {
            id: 'firstName',
            label: 'First name',
            type: 'text',
            validation: {
              max: '32',
            },
            classification: 'PUBLIC',
            acl: {
              'role-1': RU,
            },
          },
          lastName: {
            id: 'lastName',
            label: 'Last name',
            type: 'text',
            validation: {
              max: '32',
            },
            classification: 'PUBLIC',
            acl: {
              'role-1': RU,
            },
          },
          birth: {
            id: 'birth',
            label: 'Date of birth',
            type: 'date',
            classification: 'PUBLIC',
            acl: {
              'role-1': RU,
            },
          },
          address: {
            id: 'address',
            label: 'Address',
            type: 'complex',
            classification: 'PUBLIC',
            acl: {
              'role-1': RU,
            },
            members: {
              line1: {
                id: 'line1',
                label: 'Line 1',
                type: 'text',
                classification: 'PUBLIC',
                acl: {
                  'role-1': RU,
                },
              },
              line2: {
                id: 'line2',
                label: 'Line 2',
                type: 'text',
                classification: 'PUBLIC',
                acl: {
                  'role-1': RU,
                },
              },
              postcode: {
                id: 'postcode',
                label: 'Postcode',
                type: 'text',
                classification: 'PUBLIC',
                acl: {
                  'role-1': RU,
                },
                validation: {
                  max: '8',
                }
              },
            },
          },
        }
      },
    },
  });
});

test('should apply complex ACLs to collection of complex members when defined and drop ACLs for any member with implicit ACLs', () => {
  const fields = [
    {
      ...collectionIndividualsField,
      acls: [
        {role: 'role-1', create: true, read: true, update: true, delete: true},
        {role: 'role-2', create: false, read: true, update: false, delete: false},
      ],
      complexACLs: [
        {role: 'role-1', create: true, read: true, update: false, delete: false, listElementCode: 'firstName'},
        {role: 'role-1', create: true, read: true, update: false, delete: false, listElementCode: 'lastName'},
        {role: 'role-1', create: true, read: true, update: true, delete: false, listElementCode: 'address'},
        {role: 'role-1', create: false, read: true, update: true, delete: false, listElementCode: 'address.postcode'},
        {role: 'role-2', create: false, read: true, update: false, delete: false, listElementCode: 'firstName'},
      ],
    },
  ];

  expect(normaliseFields(fields)).toEqual({
    'individuals': {
      id: 'individuals',
      label: 'Individuals',
      type: 'collection',
      classification: 'PUBLIC',
      acl: {
        'role-1': CRUD,
        'role-2': AclV2.READ,
      },
      content: {
        type: 'complex',
        members: {
          firstName: {
            id: 'firstName',
            label: 'First name',
            type: 'text',
            validation: {
              max: '32',
            },
            classification: 'PUBLIC',
            acl: {
              'role-1': CR,
              'role-2': AclV2.READ,
            },
          },
          lastName: {
            id: 'lastName',
            label: 'Last name',
            type: 'text',
            validation: {
              max: '32',
            },
            classification: 'PUBLIC',
            acl: {
              'role-1': CR,
            },
          },
          birth: {
            id: 'birth',
            label: 'Date of birth',
            type: 'date',
            classification: 'PUBLIC',
            acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
          },
          address: {
            id: 'address',
            label: 'Address',
            type: 'complex',
            classification: 'PUBLIC',
            acl: {
              'role-1': CRU,
            },
            members: {
              line1: {
                id: 'line1',
                label: 'Line 1',
                type: 'text',
                classification: 'PUBLIC',
                acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
              },
              line2: {
                id: 'line2',
                label: 'Line 2',
                type: 'text',
                classification: 'PUBLIC',
                acl: {}, // <-- All permissions dropped as no explicit ACL defined for this field
              },
              postcode: {
                id: 'postcode',
                label: 'Postcode',
                type: 'text',
                classification: 'PUBLIC',
                acl: {
                  'role-1': RU,
                },
                validation: {
                  max: '8',
                }
              },
            },
          },
        }
      },
    },
  });
});


const textField = Object.freeze({
  metadata: false,
  id: 'textField1',
  case_type_id: 'UI_TEST',
  label: 'Text field 1',
  hint_text: 'This is a hint for text field 1',
  field_type: {
    id: 'Text',
    type: 'Text',
    min: null,
    max: null,
    regular_expression: null,
    fixed_list_items: [],
    complex_fields: [],
    collection_field_type: null
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
  complexACLs: [],
  show_condition: null
});

const fixedListField = Object.freeze({
  metadata: false,
  id: 'choice1',
  case_type_id: 'UI_TEST',
  label: 'Choice 1',
  hint_text: null,
  field_type: {
    id: 'FixedList-firstEnum',
    type: 'FixedList',
    min: null,
    max: null,
    regular_expression: null,
    fixed_list_items: [
      {
        code: 'option5',
        label: 'Option 5',
        order: 5
      },
      {
        code: 'option4',
        label: 'Option 4',
        order: 4
      },
      {
        code: 'option3',
        label: 'Option 3',
        order: 3
      },
      {
        code: 'option2',
        label: 'Option 2',
        order: 2
      },
      {
        code: 'option1',
        label: 'Option 1',
        order: 1
      }
    ],
    complex_fields: [],
    collection_field_type: null
  },
  security_classification: 'PRIVATE',
  acls: [
    {
      role: 'role-2',
      create: false,
      read: true,
      update: false,
      delete: false
    }
  ],
  complexACLs: [],
  show_condition: null
});

const complexApplicantField = Object.freeze({
  'metadata': false,
  'id': 'applicant',
  'case_type_id': 'UI_TEST',
  'label': 'Applicant',
  'hint_text': 'The individual on behalf of who this record is created',
  'field_type': {
    'id': 'Individual',
    'type': 'Complex',
    'min': null,
    'max': null,
    'regular_expression': null,
    'fixed_list_items': [],
    'complex_fields': [
      {
        'metadata': false,
        'id': 'firstName',
        'case_type_id': null,
        'label': 'First name',
        'hint_text': null,
        'field_type': {
          'id': 'firstName-2e2331ae-5bf7-4e17-bbee-822d3951b9f3',
          'type': 'Text',
          'min': null,
          'max': '32',
          'regular_expression': null,
          'fixed_list_items': [],
          'complex_fields': [],
          'collection_field_type': null
        },
        'hidden': null,
        'security_classification': 'PUBLIC',
        'live_from': null,
        'live_until': null,
        'acls': null,
        'complexACLs': [],
        'show_condition': null
      },
      {
        'metadata': false,
        'id': 'lastName',
        'case_type_id': null,
        'label': 'Last name',
        'hint_text': null,
        'field_type': {
          'id': 'lastName-25b9f5d3-1f78-4f16-91a5-a09ed2da7f63',
          'type': 'Text',
          'min': null,
          'max': '32',
          'regular_expression': null,
          'fixed_list_items': [],
          'complex_fields': [],
          'collection_field_type': null
        },
        'hidden': null,
        'security_classification': 'PUBLIC',
        'live_from': null,
        'live_until': null,
        'acls': null,
        'complexACLs': [],
        'show_condition': null
      },
      {
        'metadata': false,
        'id': 'birth',
        'case_type_id': null,
        'label': 'Date of birth',
        'hint_text': null,
        'field_type': {
          'id': 'Date',
          'type': 'Date',
          'min': null,
          'max': null,
          'regular_expression': null,
          'fixed_list_items': [],
          'complex_fields': [],
          'collection_field_type': null
        },
        'hidden': null,
        'security_classification': 'PUBLIC',
        'live_from': null,
        'live_until': null,
        'acls': null,
        'complexACLs': [],
        'show_condition': null
      },
      {
        'metadata': false,
        'id': 'address',
        'case_type_id': null,
        'label': 'Address',
        'hint_text': null,
        'field_type': {
          'id': 'Address',
          'type': 'Complex',
          'min': null,
          'max': null,
          'regular_expression': null,
          'fixed_list_items': [],
          'complex_fields': [
            {
              'metadata': false,
              'id': 'line1',
              'case_type_id': null,
              'label': 'Line 1',
              'hint_text': null,
              'field_type': {
                'id': 'Text',
                'type': 'Text',
                'min': null,
                'max': null,
                'regular_expression': null,
                'fixed_list_items': [],
                'complex_fields': [],
                'collection_field_type': null
              },
              'hidden': null,
              'security_classification': 'PUBLIC',
              'live_from': null,
              'live_until': null,
              'acls': null,
              'complexACLs': [],
              'show_condition': null
            },
            {
              'metadata': false,
              'id': 'line2',
              'case_type_id': null,
              'label': 'Line 2',
              'hint_text': null,
              'field_type': {
                'id': 'Text',
                'type': 'Text',
                'min': null,
                'max': null,
                'regular_expression': null,
                'fixed_list_items': [],
                'complex_fields': [],
                'collection_field_type': null
              },
              'hidden': null,
              'security_classification': 'PUBLIC',
              'live_from': null,
              'live_until': null,
              'acls': null,
              'complexACLs': [],
              'show_condition': null
            },
            {
              'metadata': false,
              'id': 'postcode',
              'case_type_id': null,
              'label': 'Postcode',
              'hint_text': null,
              'field_type': {
                'id': 'postcode-e8802421-857b-45ef-a229-a6251c81e313',
                'type': 'Text',
                'min': '6',
                'max': null,
                'regular_expression': null,
                'fixed_list_items': [],
                'complex_fields': [],
                'collection_field_type': null
              },
              'hidden': null,
              'security_classification': 'PUBLIC',
              'live_from': null,
              'live_until': null,
              'acls': null,
              'complexACLs': [],
              'show_condition': null
            }
          ],
          'collection_field_type': null
        },
        'hidden': null,
        'security_classification': 'PUBLIC',
        'live_from': null,
        'live_until': null,
        'acls': null,
        'complexACLs': [],
        'show_condition': null
      }
    ],
    'collection_field_type': null
  },
  'hidden': null,
  'security_classification': 'PUBLIC',
  'live_from': null,
  'live_until': null,
  'acls': [
    {'role': 'role-1', 'create': false, 'read': true, 'update': true, 'delete': false},
  ],
  'complexACLs': [],
  'show_condition': null
});

const collectionIndividualsField = Object.freeze({
  metadata: false,
  id: 'individuals',
  case_type_id: 'UI_TEST',
  label: 'Individuals',
  hint_text: null,
  field_type: {
    id: 'individuals-62a3cf67-a92f-43f4-ac25-e0bee2e12e13',
    type: 'Collection',
    min: null,
    max: null,
    regular_expression: null,
    fixed_list_items: [],
    complex_fields: [],
    collection_field_type: {
      id: 'Individual',
      type: 'Complex',
      min: null,
      max: null,
      regular_expression: null,
      fixed_list_items: [],
      complex_fields: [
        {
          'metadata': false,
          'id': 'firstName',
          'case_type_id': null,
          'label': 'First name',
          'hint_text': null,
          'field_type': {
            'id': 'firstName-2e2331ae-5bf7-4e17-bbee-822d3951b9f3',
            'type': 'Text',
            'min': null,
            'max': '32',
            'regular_expression': null,
            'fixed_list_items': [],
            'complex_fields': [],
            'collection_field_type': null
          },
          'hidden': null,
          'security_classification': 'PUBLIC',
          'live_from': null,
          'live_until': null,
          'acls': null,
          'complexACLs': [],
          'show_condition': null
        },
        {
          'metadata': false,
          'id': 'lastName',
          'case_type_id': null,
          'label': 'Last name',
          'hint_text': null,
          'field_type': {
            'id': 'lastName-25b9f5d3-1f78-4f16-91a5-a09ed2da7f63',
            'type': 'Text',
            'min': null,
            'max': '32',
            'regular_expression': null,
            'fixed_list_items': [],
            'complex_fields': [],
            'collection_field_type': null
          },
          'hidden': null,
          'security_classification': 'PUBLIC',
          'live_from': null,
          'live_until': null,
          'acls': null,
          'complexACLs': [],
          'show_condition': null
        },
        {
          'metadata': false,
          'id': 'birth',
          'case_type_id': null,
          'label': 'Date of birth',
          'hint_text': null,
          'field_type': {
            'id': 'Date',
            'type': 'Date',
            'min': null,
            'max': null,
            'regular_expression': null,
            'fixed_list_items': [],
            'complex_fields': [],
            'collection_field_type': null
          },
          'hidden': null,
          'security_classification': 'PUBLIC',
          'live_from': null,
          'live_until': null,
          'acls': null,
          'complexACLs': [],
          'show_condition': null
        },
        {
          'metadata': false,
          'id': 'address',
          'case_type_id': null,
          'label': 'Address',
          'hint_text': null,
          'field_type': {
            'id': 'Address',
            'type': 'Complex',
            'min': null,
            'max': null,
            'regular_expression': null,
            'fixed_list_items': [],
            'complex_fields': [
              {
                'metadata': false,
                'id': 'line1',
                'case_type_id': null,
                'label': 'Line 1',
                'hint_text': null,
                'field_type': {
                  'id': 'Text',
                  'type': 'Text',
                  'min': null,
                  'max': null,
                  'regular_expression': null,
                  'fixed_list_items': [],
                  'complex_fields': [],
                  'collection_field_type': null
                },
                'hidden': null,
                'security_classification': 'PUBLIC',
                'live_from': null,
                'live_until': null,
                'acls': null,
                'complexACLs': [],
                'show_condition': null
              },
              {
                'metadata': false,
                'id': 'line2',
                'case_type_id': null,
                'label': 'Line 2',
                'hint_text': null,
                'field_type': {
                  'id': 'Text',
                  'type': 'Text',
                  'min': null,
                  'max': null,
                  'regular_expression': null,
                  'fixed_list_items': [],
                  'complex_fields': [],
                  'collection_field_type': null
                },
                'hidden': null,
                'security_classification': 'PUBLIC',
                'live_from': null,
                'live_until': null,
                'acls': null,
                'complexACLs': [],
                'show_condition': null
              },
              {
                'metadata': false,
                'id': 'postcode',
                'case_type_id': null,
                'label': 'Postcode',
                'hint_text': null,
                'field_type': {
                  'id': 'postcode-e8802421-857b-45ef-a229-a6251c81e313',
                  'type': 'Text',
                  'min': null,
                  'max': '8',
                  'regular_expression': null,
                  'fixed_list_items': [],
                  'complex_fields': [],
                  'collection_field_type': null
                },
                'hidden': null,
                'security_classification': 'PUBLIC',
                'live_from': null,
                'live_until': null,
                'acls': null,
                'complexACLs': [],
                'show_condition': null
              }
            ],
            'collection_field_type': null
          },
          'hidden': null,
          'security_classification': 'PUBLIC',
          'live_from': null,
          'live_until': null,
          'acls': null,
          'complexACLs': [],
          'show_condition': null
        }
      ],
      collection_field_type: null
    }
  },
  hidden: null,
  security_classification: 'PUBLIC',
  live_from: null,
  live_until: null,
  acls: [
    {'role': 'role-1', 'create': false, 'read': true, 'update': true, 'delete': false},
  ],
  complexACLs: [],
  show_condition: null
});