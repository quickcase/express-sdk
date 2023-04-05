import normaliseActionLayout from './normalise-action-layout.js';

const fields = {
  field0: {}, // Omitted for brevity
  field1: {}, // Omitted for brevity
  field2: {}, // Omitted for brevity
  field3: {}, // Omitted for brevity
  field4: {}, // Omitted for brevity
  field5: {}, // Omitted for brevity
  field6: {}, // Omitted for brevity
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
        condition: 'member1 == "Yes"',
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
  complexWithOverrides: {
    type: 'complex',
    members: {
      member1: {},
      member2: {},
      member3: {
        type: 'complex',
        members: {
          member31: {},
          member32: {},
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
          condition: 'member1 == "Yes"',
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
  collectionWithOverrides: {
    type: 'collection',
    content: {
      type: 'complex',
      members: {
        member1: {},
        member2: {},
        member3: {
          type: 'complex',
          members: {
            member31: {},
            member32: {},
          },
        },
      },
    },
    // Rest omitted for brevity
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
              condition: 'member1 == "Yes"',
            },
          },
        },
      },
    },
  },
  complexWithCollectionWithOverrides: {
    type: 'complex',
    members: {
      nestedCollection: {
        type: 'collection',
        content: {
          type: 'complex',
          members: {
            member1: {},
            member2: {},
          },
        },
      },
    },
  },
};

const action = {
  case_fields: [
    {
      case_field_id: 'field0',
      label: 'Label override for field 0',
      hint_text: 'Hint override for field 0',
      display_context: 'MANDATORY',
      display_mode: 'plain',
      display_mode_parameters: {
        key1: 'value1',
      },
      show_summary_change_option: true,
    },
    {
      case_field_id: 'field1',
      label: null,
      hint_text: null,
      display_context: 'OPTIONAL',
      show_condition: 'field0 == "Yes"',
      display_mode: 'plain',
      display_mode_parameters: null,
      show_summary_change_option: true,
    },
    {
      case_field_id: 'field2',
      display_context: 'MANDATORY',
      show_condition: 'field1 == "No"',
      display_mode_parameters: {
        key: 'value',
      },
    },
    {
      case_field_id: 'field3',
      display_context: 'OPTIONAL',
      show_summary_change_option: true,
    },
    {
      case_field_id: 'field4',
      display_context: 'OPTIONAL',
    },
    {
      case_field_id: 'field5',
      display_context: 'OPTIONAL',
      show_summary_change_option: true,
    },
    {
      case_field_id: 'field6',
      display_context: 'OPTIONAL',
    },
    {
      case_field_id: 'complexNoOverrides',
      label: 'Populated with all members from definition',
      display_context: 'MANDATORY',
    },
    {
      case_field_id: 'complexWithOverrides',
      hint_text: 'Exclusively populated with overridden members',
      display_context: 'MANDATORY',
      case_fields_complex: [
        {
          reference: 'member2',
          label: null,
          hint: null,
          order: 2,
          displayContext: 'OPTIONAL',
          showCondition: 'member1 == "Yes"',
          displayMode: null,
          displayModeParameters: {},
        },
        {
          reference: 'member1',
          label: null,
          hint: null,
          order: 1,
          displayContext: 'READONLY',
          showCondition: null,
          displayMode: 'plain',
          displayModeParameters: {},
        },
        {
          reference: 'member3',
          label: null,
          hint: null,
          order: 3,
          displayContext: 'MANDATORY',
          showCondition: null,
          displayMode: null,
          displayModeParameters: {},
        },
        {
          reference: 'member3.member32',
          label: null,
          hint: 'override hint for member32',
          order: 1,
          displayContext: 'MANDATORY',
          showCondition: null,
          displayMode: null,
          displayModeParameters: {
            'key1': 'value1',
          },
        },
      ],
    },
    {
      case_field_id: 'collectionNoOverrides',
      label: 'Populated with all members from definition',
      display_context: 'MANDATORY',
    },
    {
      case_field_id: 'collectionWithOverrides',
      hint_text: 'Exclusively populated with overridden members',
      display_context: 'MANDATORY',
      case_fields_complex: [
        {
          reference: 'member2',
          label: null,
          hint: null,
          order: 2,
          displayContext: 'OPTIONAL',
          showCondition: 'member1 == "Yes"',
          displayMode: null,
          displayModeParameters: {},
        },
        {
          reference: 'member1',
          label: null,
          hint: null,
          order: 1,
          displayContext: 'READONLY',
          showCondition: null,
          displayMode: 'plain',
          displayModeParameters: {},
        },
        {
          reference: 'member3',
          label: null,
          hint: null,
          order: 3,
          displayContext: 'MANDATORY',
          showCondition: null,
          displayMode: null,
          displayModeParameters: {},
        },
        {
          reference: 'member3.member32',
          label: null,
          hint: 'override hint for member32',
          order: 1,
          displayContext: 'MANDATORY',
          showCondition: null,
          displayMode: null,
          displayModeParameters: {
            'key1': 'value1',
          },
        },
      ],
    },
    {
      case_field_id: 'complexWithCollectionNoOverrides',
      display_context: 'MANDATORY',
    },
    {
      case_field_id: 'complexWithCollectionWithOverrides',
      display_context: 'MANDATORY',
      case_fields_complex: [
        {
          reference: 'nestedCollection',
          label: null,
          hint: null,
          order: 1,
          displayContext: 'OPTIONAL',
          showCondition: 'field0 == "Yes"',
          displayMode: null,
          displayModeParameters: {},
        },
        {
          reference: 'nestedCollection.member2',
          label: null,
          hint: 'override hint for member2',
          order: 1,
          displayContext: 'MANDATORY',
          showCondition: null,
          displayMode: null,
          displayModeParameters: {
            'key1': 'value1',
          },
        },
      ],
    },
  ],
  show_event_notes: false,
  end_button_label: null,
};

test('should merge and normalise action fields and wizard page fields into normalised steps', () => {
  const layout = {
    wizard_pages: [
      {
        id: 'page1',
        label: 'First page',
        order: 1,
        show_condition: 'field0 STARTS_WITH_IC "Y"',
        wizard_page_fields: [
          {
            case_field_id: 'field0',
            order: 1,
          },
          {
            case_field_id: 'field1',
            order: 2,
          },
        ],
      },
    ],
  };

  expect(normaliseActionLayout(fields)(action, layout)).toEqual({
    steps: [
      {
        id: 'page1',
        label: 'First page',
        condition: 'field0 STARTS_WITH_IC "Y"',
        fields: [
          {
            id: 'field0',
            label: 'Label override for field 0',
            hint: 'Hint override for field 0',
            use: 'MANDATORY',
            display: {
              mode: 'plain',
              parameters: {
                key1: 'value1',
              },
            },
          },
          {
            id: 'field1',
            use: 'OPTIONAL',
            condition: 'field0 == "Yes"',
            display: {
              mode: 'plain',
            },
          },
        ],
        columns: [],
      },
    ],
    submit: {},
  });
});

test('should sort steps', () => {
  const layout = {
    wizard_pages: [
      {
        id: 'page2',
        label: 'Second page',
        order: 2,
        wizard_page_fields: [
          {
            case_field_id: 'field2',
            order: 1,
          },
        ],
      },
      {
        id: 'page1',
        label: 'First page',
        order: 1,
        wizard_page_fields: [
          {
            case_field_id: 'field1',
            order: 1,
          },
        ],
      },
    ],
  };

  expect(normaliseActionLayout(fields)(action, layout)).toEqual({
    steps: [
      {
        id: 'page1',
        label: 'First page',
        fields: [
          {
            id: 'field1',
            use: 'OPTIONAL',
            condition: 'field0 == "Yes"',
            display: {
              mode: 'plain',
            },
          },
        ],
        columns: [],
      },
      {
        id: 'page2',
        label: 'Second page',
        fields: [
          {
            id: 'field2',
            use: 'MANDATORY',
            condition: 'field1 == "No"',
            display: {
              parameters: {
                key: 'value',
              },
            },
            noCheck: true,
          },
        ],
        columns: [],
      },
    ],
    submit: {},
  });
});

test('should sort fields across top-levels and columns', () => {
  const layout = {
    wizard_pages: [
      {
        id: 'page1',
        label: 'First page',
        order: 1,
        wizard_page_fields: [
          {
            case_field_id: 'field6',
            order: 2,
            page_column_no: 2,
          },
          {
            case_field_id: 'field4',
            order: 2,
            page_column_no: 1,
          },
          {
            case_field_id: 'field2',
            order: 2,
            page_column_no: null,
          },
          {
            case_field_id: 'field5',
            order: 1,
            page_column_no: 2,
          },
          {
            case_field_id: 'field3',
            order: 1,
            page_column_no: 1,
          },
          {
            case_field_id: 'field1',
            order: 1,
            page_column_no: null,
          },
        ],
      },
    ],
  };

  expect(normaliseActionLayout(fields)(action, layout)).toEqual({
    steps: [
      {
        id: 'page1',
        label: 'First page',
        fields: [
          {
            id: 'field1',
            use: 'OPTIONAL',
            condition: 'field0 == "Yes"',
            display: {
              mode: 'plain',
            },
          },
          {
            id: 'field2',
            use: 'MANDATORY',
            condition: 'field1 == "No"',
            display: {
              parameters: {
                key: 'value',
              },
            },
            noCheck: true,
          },
        ],
        columns: [
          {
            id: '1',
            fields: [
              {
                id: 'field3',
                use: 'OPTIONAL',
              },
              {
                id: 'field4',
                use: 'OPTIONAL',
                noCheck: true,
              },
            ],
          },
          {
            id: '2',
            fields: [
              {
                id: 'field5',
                use: 'OPTIONAL',
              },
              {
                id: 'field6',
                use: 'OPTIONAL',
                noCheck: true,
              },
            ],
          },
        ],
      },
    ],
    submit: {},
  });
});

test('should capture submit button label when defined in action', () => {
  const customAction = {
    ...action,
    end_button_label: 'Submit this action',
  };

  const layout = {
    wizard_pages: [],
  };

  expect(normaliseActionLayout(fields)(customAction, layout)).toEqual({
    steps: [],
    submit: {
      buttonLabel: 'Submit this action',
    },
  });
});

test('should enable note when enabled in action', () => {
  const customAction = {
    ...action,
    show_event_notes: true,
  };

  const layout = {
    wizard_pages: [],
  };

  expect(normaliseActionLayout(fields)(customAction, layout)).toEqual({
    steps: [],
    submit: {
      note: true,
    },
  });
});

test('should enable checkAnswers when enabled in action', () => {
  const customAction = {
    ...action,
    show_summary: true,
  };

  const layout = {
    wizard_pages: [],
  };

  expect(normaliseActionLayout(fields)(customAction, layout)).toEqual({
    steps: [],
    submit: {
      checkAnswers: true,
    },
  });
});

describe('Complex', () => {
  test('should populate complex members layout (incl. conditions) from definition when no overrides and inherit use from parent', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'complexNoOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'complexNoOverrides',
              label: 'Populated with all members from definition',
              use: 'MANDATORY',
              noCheck: true,
              members: [
                {
                  id: 'member1',
                  use: 'MANDATORY',
                },
                {
                  id: 'member2',
                  use: 'MANDATORY',
                  condition: 'member1 == "Yes"',
                },
                {
                  id: 'member3',
                  use: 'MANDATORY',
                  members: [
                    {
                      id: 'member31',
                      use: 'MANDATORY',
                    },
                    {
                      id: 'member32',
                      use: 'MANDATORY',
                    },
                  ],
                },
              ],
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });

  test('should sort, expand and normalise complex overrides', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'complexWithOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'complexWithOverrides',
              hint: 'Exclusively populated with overridden members',
              use: 'MANDATORY',
              noCheck: true,
              members: [
                {
                  id: 'member1',
                  use: 'READONLY',
                  display: {
                    mode: 'plain',
                  },
                },
                {
                  id: 'member2',
                  use: 'OPTIONAL',
                  condition: 'member1 == "Yes"',
                },
                {
                  id: 'member3',
                  use: 'MANDATORY',
                  members: [
                    {
                      id: 'member32',
                      hint: 'override hint for member32',
                      use: 'MANDATORY',
                      display: {
                        parameters: {
                          'key1': 'value1',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });
});

describe('Collection of Complex', () => {
  test('should populate collection of complex members layout (incl. conditions) from definition when no overrides and inherit use from parent', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'collectionNoOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'collectionNoOverrides',
              label: 'Populated with all members from definition',
              use: 'MANDATORY',
              noCheck: true,
              content: {
                members: [
                  {
                    id: 'member1',
                    use: 'MANDATORY',
                  },
                  {
                    id: 'member2',
                    use: 'MANDATORY',
                    condition: 'member1 == "Yes"',
                  },
                  {
                    id: 'member3',
                    use: 'MANDATORY',
                    members: [
                      {
                        id: 'member31',
                        use: 'MANDATORY',
                      },
                      {
                        id: 'member32',
                        use: 'MANDATORY',
                      },
                    ],
                  },
                ],
              },
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });

  test('should sort, expand and normalise complex overrides in collection of complex', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'collectionWithOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'collectionWithOverrides',
              hint: 'Exclusively populated with overridden members',
              use: 'MANDATORY',
              noCheck: true,
              content: {
                members: [
                  {
                    id: 'member1',
                    use: 'READONLY',
                    display: {
                      mode: 'plain',
                    },
                  },
                  {
                    id: 'member2',
                    use: 'OPTIONAL',
                    condition: 'member1 == "Yes"',
                  },
                  {
                    id: 'member3',
                    use: 'MANDATORY',
                    members: [
                      {
                        id: 'member32',
                        hint: 'override hint for member32',
                        use: 'MANDATORY',
                        display: {
                          parameters: {
                            'key1': 'value1',
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });
});

describe('Collection of Complex in Complex', () => {
  test('should populate complex members layout (incl. conditions) from definition when no overrides and inherit use from parent', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'complexWithCollectionNoOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'complexWithCollectionNoOverrides',
              use: 'MANDATORY',
              noCheck: true,
              members: [
                {
                  id: 'nestedCollection',
                  use: 'MANDATORY',
                  content: {
                    members: [
                      {
                        id: 'member1',
                        use: 'MANDATORY',
                      },
                      {
                        id: 'member2',
                        use: 'MANDATORY',
                        condition: 'member1 == "Yes"',
                      },
                    ],
                  },
                }
              ],
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });

  test('should sort, expand and normalise complex overrides in collection of complex', () => {
    const layout = {
      wizard_pages: [
        {
          id: 'page1',
          label: 'First page',
          order: 1,
          wizard_page_fields: [
            {
              case_field_id: 'complexWithCollectionWithOverrides',
              order: 1,
            },
          ],
        },
      ],
    };

    expect(normaliseActionLayout(fields)(action, layout)).toEqual({
      steps: [
        {
          id: 'page1',
          label: 'First page',
          fields: [
            {
              id: 'complexWithCollectionWithOverrides',
              use: 'MANDATORY',
              noCheck: true,
              members: [
                {
                  id: 'nestedCollection',
                  use: 'OPTIONAL',
                  condition: 'field0 == "Yes"',
                  content: {
                    members: [
                      {
                        id: 'member2',
                        use: 'MANDATORY',
                        hint: 'override hint for member2',
                        display: {
                          parameters: {
                            'key1': 'value1',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
          columns: [],
        },
      ],
      submit: {},
    });
  });
});