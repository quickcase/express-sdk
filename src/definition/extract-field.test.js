import * as AclV2 from '../acl-v2.js';
import extractField from './extract-field.js';

const type = {
  states: {
    state1: {id: 'state1', name: 'State 1'},
    state2: {id: 'state2', name: 'State 2'},
    state3: {id: 'state3', name: 'State 3'},
  },
  fields: {
    field1: {
      id: 'field1',
      type: 'text',
      label: 'Field 1',
    },
    field2: {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
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
    simpleCollection: {
      id: 'simpleCollection',
      type: 'collection',
      label: 'Simple collection',
      content: {
        type: 'text',
      },
    },
    complexCollection: {
      id: 'complexCollection',
      type: 'collection',
      label: 'Complex collection',
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
};

test('should throw error if provided path is not of a supported type', () => {
  expect(() => extractField(type)(123)).toThrow('Unsupported path \'123\' of type number');
});

test('should throw error if provided path is null', () => {
  expect(() => extractField(type)(null)).toThrow('Unsupported path \'null\' of type object');
});

test.each([
  {
    name: 'should return undefined when field ID not found',
    path: 'notFound',
    expected: undefined,
  },
  {
    name: 'should return field definition when top-level field found',
    path: 'field1',
    expected: type.fields.field1,
  },
  {
    name: 'should extract complex member definition when targeted by path',
    path: 'complexField1.member3.member31',
    expected: type.fields.complexField1.members.member3.members.member31,
  },
  {
    name: 'should extract definition of simple collection content when using empty square brackets (any item)',
    path: 'simpleCollection[].value',
    expected: type.fields.simpleCollection.content,
  },
  {
    name: 'should extract definition of simple collection content when using non-empty square brackets (specific item)',
    path: 'simpleCollection[id:123].value',
    expected: type.fields.simpleCollection.content,
  },
  {
    name: 'should extract definition of complex collection content when using empty square brackets (any item)',
    path: 'complexCollection[].value',
    expected: type.fields.complexCollection.content,
  },
  {
    name: 'should extract definition of complex collection content when using non-empty square brackets (specific item)',
    path: 'complexCollection[id:123].value',
    expected: type.fields.complexCollection.content,
  },
  {
    name: 'should extract definition of member of complex collection content',
    path: 'complexCollection[].value.member1',
    expected: type.fields.complexCollection.content.members.member1,
  },
  {
    name: 'should return undefined when collection field not found',
    path: 'collectionNotFound[]',
    expected: undefined,
  },
  {
    name: 'should return undefined when trying to extract from a non-collection as a collection',
    path: 'field1[]',
    expected: undefined,
  },
])('$name', ({path, expected}) => {
  expect(extractField(type)(path)).toEqual(expected);
});

test('when given an array of paths, returns a matching array of definitions', () => {
  expect(extractField(type)([
    'field1',
    '[reference]',
    'complexField1.member2',
  ])).toEqual([
    type.fields.field1,
    {
      id: '[reference]',
      type: 'metadata',
      label: 'Reference'
    },
    type.fields.complexField1.members.member2,
  ]);
});

test('when given an object of paths, returns a matching object of definitions', () => {
  expect(extractField(type)({
    a: 'field1',
    b: '[reference]',
    c: 'complexField1.member2',
  })).toEqual({
    a: type.fields.field1,
    b: {
      id: '[reference]',
      type: 'metadata',
      label: 'Reference'
    },
    c: type.fields.complexField1.members.member2,
  });
});

describe('metadata', () => {
  test('should return undefined for unknown metadata', () => {
    expect(extractField(type)('[notMetadata]')).toBe(undefined);
  });

  test.each([
    '[workspace]',
    '[WORKSPACE]', // Case insensitive
    '[organisation]', // Legacy alias
    '[ORGANISATION]', // Legacy alias, case insensitive
    '[jurisdiction]', // Legacy alias
    '[JURISDICTION]', // Legacy alias, case insensitive
  ])('should return static metadata definition for workspace: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[workspace]',
      type: 'metadata',
      label: 'Workspace',
      options: [],
    });
  });

  test.each([
    '[type]',
    '[TYPE]', // Case insensitive
    '[case_type]', // Legacy alias
    '[CASE_TYPE]', // Legacy alias, case insensitive
  ])('should return static metadata definition for type: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[type]',
      type: 'metadata',
      label: 'Type',
      options: [],
    });
  });

  test.each([
    '[state]',
    '[STATE]', // Case insensitive
  ])('should return static metadata definition for state with options populated from type: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[state]',
      type: 'metadata',
      label: 'State',
      options: [
        {code: 'state1', label: 'State 1'},
        {code: 'state2', label: 'State 2'},
        {code: 'state3', label: 'State 3'},
      ],
    });
  });

  test.each([
    '[id]',
    '[ID]', // Case insensitive
    '[reference]', // Alias
    '[REFERENCE]', // Alias, case-insensitive
    '[case_reference]', // Legacy alias
    '[CASE_REFERENCE]', // Legacy alias, case-insensitive
  ])('should return static metadata definition for reference: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[reference]',
      type: 'metadata',
      label: 'Reference',
    });
  });

  test.each([
    '[classification]',
    '[CLASSIFICATION]', // Case insensitive
    '[security_classification]', // Alias
    '[SECURITY_CLASSIFICATION]', // Alias, case-insensitive
  ])('should return static metadata definition for classification: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[classification]',
      type: 'metadata',
      label: 'Classification',
      options: [
        {code: 'PUBLIC', label: 'Public'},
        {code: 'PRIVATE', label: 'Private'},
        {code: 'RESTRICTED', label: 'Restricted'},
      ],
    });
  });

  test.each([
    '[created]',
    '[CREATED]', // Case insensitive
    '[created_date]', // Legacy alias
    '[CREATED_DATE]', // Legacy alias, case-insensitive
  ])('should return static metadata definition for created date: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[created]',
      type: 'metadata',
      label: 'Created',
    });
  });

  test.each([
    '[modified]',
    '[MODIFIED]', // Case insensitive
    '[last_modified]', // Alias
    '[LAST_MODIFIED]', // Alias, case-insensitive
  ])('should return static metadata definition for last modified date: %s', (path) => {
    expect(extractField(type)(path)).toEqual({
      id: '[lastModified]',
      type: 'metadata',
      label: 'Last modified',
    });
  });

  test('should populate workspace options using workspace provider', () => {
    const extractor = extractField(type, {
      workspaceProvider: () => [
        {id: 'workspace-1', name: 'Workspace 1'},
        {id: 'workspace-2', name: 'Workspace 2'},
        {id: 'workspace-3', name: 'Workspace 3'},
      ],
    });

    expect(extractor('[workspace]')).toEqual({
      id: '[workspace]',
      type: 'metadata',
      label: 'Workspace',
      options: [
        {code: 'workspace-1', label: 'Workspace 1'},
        {code: 'workspace-2', label: 'Workspace 2'},
        {code: 'workspace-3', label: 'Workspace 3'},
      ],
    });
  });

  test('should populate type options using type provider', () => {
    const extractor = extractField(type, {
      typeProvider: () => [
        {id: 'type-1', name: 'Type 1'},
        {id: 'type-2', name: 'Type 2'},
        {id: 'type-3', name: 'Type 3'},
      ],
    });

    expect(extractor('[type]')).toEqual({
      id: '[type]',
      type: 'metadata',
      label: 'Type',
      options: [
        {code: 'type-1', label: 'Type 1'},
        {code: 'type-2', label: 'Type 2'},
        {code: 'type-3', label: 'Type 3'},
      ],
    });
  });

  test('should sort state metadata options by state order' , () => {
    const unorderedType = {
      ...type,
      states: {
        state2: {id: 'state2', name: 'State 2', order: 2},
        state3: {id: 'state3', name: 'State 3', order: 3},
        state1: {id: 'state1', name: 'State 1', order: 1},
      },
    };

    expect(extractField(unorderedType)('[state]')).toEqual({
      id: '[state]',
      type: 'metadata',
      label: 'State',
      options: [
        {code: 'state1', label: 'State 1'},
        {code: 'state2', label: 'State 2'},
        {code: 'state3', label: 'State 3'},
      ],
    });
  });
});
