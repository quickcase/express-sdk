import normaliseViewLayout from './normalise-view-layout.js';

const fields = {
  field0: {
    id: 'field0',
    type: 'text',
  },
  field1: {
    id: 'field1',
    type: 'text',
  },
  field2: {
    id: 'field2',
    type: 'text',
  },
  field3: {
    id: 'field3',
    type: 'text',
  },
  complexNoOverrides: {
    id: 'complexNoOverrides',
    type: 'complex',
    label: 'Complex without overrides',
    members: {
      member1: {
        id: 'member1',
        type: 'text',
        label: 'Member 1',
      },
      member2: {
        id: 'member2',
        type: 'text',
        label: 'Member 2',
        hint: 'Conditioned by member1',
        condition: '@.member1 == "Yes"',
      },
      member3: {
        id: 'member3',
        type: 'complex',
        label: 'Member 3',
        members: {
          'member31': {
            id: 'member31',
            type: 'text',
            label: 'Member 31',
          },
          'member32': {
            id: 'member32',
            type: 'text',
            label: 'Member 32',
          },
        },
      },
    },
  },
  collectionNoOverrides: {
    id: 'collectionNoOverrides',
    type: 'collection',
    label: 'Collection without overrides',
    content: {
      type: 'complex',
      members: {
        member1: {
          id: 'member1',
          type: 'text',
          label: 'Member 1',
        },
        member2: {
          id: 'member2',
          type: 'text',
          label: 'Member 2',
          hint: 'Conditioned by member1',
          condition: '@.member1 == "Yes"',
        },
        member3: {
          id: 'member3',
          type: 'complex',
          label: 'Member 3',
          members: {
            'member31': {
              id: 'member31',
              type: 'text',
              label: 'Member 31',
            },
            'member32': {
              id: 'member32',
              type: 'text',
              label: 'Member 32',
            },
          },
        },
      },
    },
  },
  complexWithCollectionNoOverrides: {
    id: 'complexWithCollectionNoOverrides',
    type: 'complex',
    members: {
      nestedCollection: {
        id: 'nestedCollection',
        type: 'collection',
        content: {
          type: 'complex',
          members: {
            member1: {
              id: 'member1',
              type: 'text',
              label: 'Member 1',
            },
            member2: {
              id: 'member2',
              type: 'text',
              label: 'Member 2',
              hint: 'Conditioned by member1',
              condition: '@.member1 == "Yes"',
            },
          },
        },
      },
    },
  },
};

test('should normalise layout groups and fields', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group1',
        label: 'Group 1',
        order: 1,
        role: 'role-1',
        show_condition: 'field1 == "Yes"',
        tab_fields: [
          {
            case_field: {
              id: 'field0',
              metadata: false,
              hidden: null,
              security_classification: "PUBLIC",
            },
            order: 1,
            show_condition: 'field0 == "No"',
            display_context_parameter: null,
            display_mode: 'default',
            display_mode_parameters: {
              unit: 'degrees'
            },
          }
        ],
      }
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        condition: 'field1 == "Yes"',
        roles: [
          'role-1',
        ],
        fields: [
          {
            id: 'field0',
            condition: 'field0 == "No"',
            display: {
              mode: 'default',
              parameters: {
                unit: 'degrees'
              },
            },
          },
        ],
      },
    ],
  });
});

test('should sort groups', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group3',
        label: 'Group 3',
        order: 3,
        role: null,
        show_condition: null,
        tab_fields: [],
      },
      {
        id: 'group1',
        label: 'Group 1',
        order: null,
        role: null,
        show_condition: null,
        tab_fields: [],
      },
      {
        id: 'group2',
        label: 'Group 2',
        order: 2,
        role: null,
        show_condition: null,
        tab_fields: [],
      },
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        roles: [],
        fields: [],
      },
      {
        id: 'group2',
        label: 'Group 2',
        roles: [],
        fields: [],
      },
      {
        id: 'group3',
        label: 'Group 3',
        roles: [],
        fields: [],
      },
    ],
  });
});

test('should sort fields in groups', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group1',
        label: 'Group 1',
        order: 1,
        role: null,
        show_condition: null,
        tab_fields: [
          {
            case_field: {
              id: 'field3',
            },
            order: 3,
          },
          {
            case_field: {
              id: 'field1',
            },
            order: 1,
          },
          {
            case_field: {
              id: 'field2',
            },
            order: 2,
          },
        ],
      },
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        roles: [],
        fields: [
          {id: 'field1'},
          {id: 'field2'},
          {id: 'field3'},
        ],
      },
    ],
  });
});

test('should recursively populate complex members layout (incl. conditions) from definition', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group1',
        label: 'Group 1',
        order: 1,
        role: null,
        show_condition: null,
        tab_fields: [
          {
            case_field: {id: 'complexNoOverrides'},
          },
        ],
      },
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        roles: [],
        fields: [
          {
            id: 'complexNoOverrides',
            members: [
              {id: 'member1'},
              {
                id: 'member2',
                condition: '@.member1 == "Yes"',
              },
              {
                id: 'member3',
                members: [
                  {id: 'member31'},
                  {id: 'member32'},
                ],
              },
            ],
          },
        ],
      },
    ],
  });
});

test('should recursively populate complex members layout (incl. conditions) inside collection from definition', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group1',
        label: 'Group 1',
        order: 1,
        role: null,
        show_condition: null,
        tab_fields: [
          {
            case_field: {id: 'collectionNoOverrides'},
          },
        ],
      },
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        roles: [],
        fields: [
          {
            id: 'collectionNoOverrides',
            content: {
              members: [
                {id: 'member1'},
                {
                  id: 'member2',
                  condition: '@.member1 == "Yes"',
                },
                {
                  id: 'member3',
                  members: [
                    {id: 'member31'},
                    {id: 'member32'},
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  });
});

test('should recursively populate complex members layout (incl. conditions) in collection nested in complex from definition', () => {
  const layout = {
    case_type_id: 'type-1',
    channels: [],
    tabs: [
      {
        id: 'group1',
        label: 'Group 1',
        order: 1,
        role: null,
        show_condition: null,
        tab_fields: [
          {
            case_field: {id: 'complexWithCollectionNoOverrides'},
          },
        ],
      },
    ],
  };

  expect(normaliseViewLayout(fields)(layout)).toEqual({
    groups: [
      {
        id: 'group1',
        label: 'Group 1',
        roles: [],
        fields: [
          {
            id: 'complexWithCollectionNoOverrides',
            members: [
              {
                id: 'nestedCollection',
                content: {
                  members: [
                    {id: 'member1'},
                    {
                      id: 'member2',
                      condition: '@.member1 == "Yes"',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  });
});
