import {normaliseSearchInputsLayout, normaliseSearchResultsLayout} from './normalise-search-layout.js';

const type = {
  acl: {},
  fields: {
    textField1: {
      id: 'textField1',
      type: 'text',
    },
    complexField1: {
      id: 'complexField1',
      type: 'complex',
      label: 'Complex field 1',
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
  },
  states: {},
};

describe('normaliseSearchInputsLayout', () => {
  test('should return empty fields when no fields in layout', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [],
    });
  });

  test('should drop field for which no definition is found (failsafe)', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: 'fieldNotFound',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [],
    });
  });

  test('should normalise and sort fields (incl. metadata name)', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: '[LAST_MODIFIED_DATE]',
          case_field_element_path: null,
          label: null,
          order: 2,
          role: null
        },
        {
          field_path: 'textField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: null,
          display_mode: 'default',
          display_mode_parameters: {
            key1: 'value1',
          },
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          roles: [],
          display: {
            mode: 'default',
            parameters: {
              key1: 'value1',
            },
          },
        },
        {
          id: '[lastModifiedAt]',
          roles: [],
        },
      ],
    });
  });

  test('should include label overrides when provided', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: 'textField1',
          case_field_element_path: null,
          label: 'Text field 1',
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          label: 'Text field 1',
          roles: [],
        },
      ],
    });
  });

  test('should present role filters as array when provided', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: 'textField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: 'role-1'
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          roles: ['role-1'],
        },
      ],
    });
  });

  test('should return field ID as path when referring to nested complex member', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: 'complexField1',
          case_field_element_path: 'member1',
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'complexField1.member1',
          roles: [],
        },
      ],
    });
  });

  test('should recursively populate complex members layout from definition', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          field_path: 'complexField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchInputsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'complexField1',
          roles: [],
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
    });
  });
});

describe('normaliseSearchResultsLayout', () => {
  test('should return empty fields when no fields in layout', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [],
    });
  });

  test('should normalise and sort fields (incl. metadata name)', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          metadata: true,
          field_path: '[LAST_MODIFIED_DATE]',
          case_field_element_path: null,
          label: null,
          order: 2,
          role: null
        },
        {
          metadata: false,
          field_path: 'textField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          roles: [],
        },
        {
          id: '[lastModifiedAt]',
          roles: [],
        },
      ],
    });
  });

  test('should include label overrides when provided', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          metadata: false,
          field_path: 'textField1',
          case_field_element_path: null,
          label: 'Text field 1',
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          label: 'Text field 1',
          roles: [],
        },
      ],
    });
  });

  test('should present role filters as array when provided', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          metadata: false,
          field_path: 'textField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: 'role-1'
        },
      ],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'textField1',
          roles: ['role-1'],
        },
      ],
    });
  });

  test('should return field ID as path when referring to nested complex member', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          metadata: false,
          field_path: 'complexField1',
          case_field_element_path: 'member1',
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'complexField1.member1',
          roles: [],
        },
      ],
    });
  });

  test('should recursively populate complex members layout from definition', () => {
    const layout = {
      case_type_id: 'type-1',
      fields: [
        {
          metadata: false,
          field_path: 'complexField1',
          case_field_element_path: null,
          label: null,
          order: 1,
          role: null
        },
      ],
    };

    expect(normaliseSearchResultsLayout(type)(layout)).toEqual({
      fields: [
        {
          id: 'complexField1',
          roles: [],
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
    });
  });
});
