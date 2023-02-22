import extractor from './extractor.js';

test('should throw error if provided path is not of a supported type', () => {
  const record = {};

  expect(() => extractor(record)(123)).toThrow('Unsupported path \'123\' of type number');
});

test('should throw error if provided path is null', () => {
  const record = {};

  expect(() => extractor(record)(null)).toThrow('Unsupported path \'null\' of type object');
});

test('should extract field from record `data`', () => {
  const record = {
    data: {
      level1: {
        level2: 'value'
      }
    }
  };

  const fieldValue = extractor(record)('level1.level2');
  expect(fieldValue).toEqual('value');
});

test('should extract field from record `case_data`', () => {
  const record = {
    case_data: {
      level1: {
        level2: 'value'
      }
    }
  };

  const fieldValue = extractor(record)('level1.level2');
  expect(fieldValue).toEqual('value');
});

test('should extract field as undefined when path does not exist', () => {
  const record = {
    data: {
      level1: {
        level2: 'value'
      }
    }
  };

  const fieldValue = extractor(record)('nolevel.level2');
  expect(fieldValue).toBeUndefined();
});

test('should extract field as undefined when parent element is null', () => {
  const record = {
    data: {
      level1: null
    }
  };

  const fieldValue = extractor(record)('level1.level2');
  expect(fieldValue).toBeUndefined();
});

test('should extract field as undefined when record has no data', () => {
  const record = {};

  const fieldValue = extractor(record)('level1.level2');
  expect(fieldValue).toBeUndefined();
});

test('should extract array of fields from record data', () => {
  const record = {
    data: {
      level1: {level2: 'value1'},
      field2: 'value2',
    },
  };

  const values = extractor(record)([
    'level1.level2',
    'notFound1',
    'field2',
    'notFound2',
  ]);
  expect(values).toEqual(['value1', undefined, 'value2', undefined]);
});

test('should extract object of fields from record data', () => {
  const record = {
    data: {
      level1: {level2: 'value1'},
      field2: 'value2',
    },
  };

  const values = extractor(record)({
    value1: 'level1.level2',
    notFound1: 'notFound1',
    value2: 'field2',
    notFound2: 'notFound2',
  });
  expect(values).toEqual({
    value1: 'value1',
    notFound1: undefined,
    value2: 'value2',
    notFound2: undefined,
  });
});

describe('extracting collection items', () => {
  test('should extract simple collection item from record `data` using item index', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: 'value1'},
            {id: '456', value: 'value2'},
            {id: '789', value: 'value3'},
          ],
        }
      }
    };

    const fieldValues = extractor(record)([
      'level1.level2[2].value',
      'level1.level2[1].value',
      'level1.level2[0].value',
    ]);
    expect(fieldValues).toEqual([
      'value3',
      'value2',
      'value1',
    ]);
  });

  test('should extract complex collection item from record `data` using item index', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: {key: 'value1'}},
            {id: '456', value: {key: 'value2'}},
          ],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[1].value.key');
    expect(fieldValues).toEqual('value2');
  });

  test('should extract collection item as undefined when out of range', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: 'value1'},
          ],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[1].value');
    expect(fieldValues).toBeUndefined();
  });

  test('should extract collection item as undefined when invalid index', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: 'value1'},
          ],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[a].value');
    expect(fieldValues).toBeUndefined();
  });

  test('should extract collection item as undefined when not collection', () => {
    const record = {
      data: {
        level1: {
          level2: 'hello',
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[0].value');
    expect(fieldValues).toBeUndefined();
  });

  test('should extract collection item as undefined when item malformed', () => {
    const record = {
      data: {
        level1: {
          level2: [true],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[0].value');
    expect(fieldValues).toBeUndefined();
  });

  test('should extract collection item as undefined when null', () => {
    const record = {
      data: {
        level1: {
          level2: [null],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[0].value');
    expect(fieldValues).toBeUndefined();
  });

  test('should extract simple collection item from record `data` using item ID', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: 'value1'},
            {id: '456', value: 'value2'},
            {id: '789', value: 'value3'},
          ],
        }
      }
    };

    const fieldValues = extractor(record)([
      'level1.level2[id:456].value',
      'level1.level2[id:789].value',
      'level1.level2[id:123].value',
    ]);
    expect(fieldValues).toEqual([
      'value2',
      'value3',
      'value1',
    ]);
  });

  test('should extract complex collection item from record `data` using item ID', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: {key: 'value1'}},
          ],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[id:123].value.key');
    expect(fieldValues).toEqual('value1');
  });

  test('should extract collection item as undefined when invalid ID', () => {
    const record = {
      data: {
        level1: {
          level2: [
            {id: '123', value: 'value1'},
          ],
        }
      }
    };

    const fieldValues = extractor(record)('level1.level2[id:456].value');
    expect(fieldValues).toBeUndefined();
  });
});

describe('extracting metadata', () => {
  test('should returned undefined when metadata does not exist', () => {
    const record = {};

    const values = extractor(record)('[not_a_metadata]');
    expect(values).toBe(undefined);
  });

  test('should extract workspace', () => {
    const record = {
      jurisdiction: 'Workspace-1',
      data: {
        jurisdiction: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[workspace]',
      '[WORKSPACE]', // Case insensitive
      '[organisation]', // Legacy alias
      '[ORGANISATION]', // Legacy alias, case insensitive
      '[jurisdiction]', // Legacy alias
      '[JURISDICTION]', // Legacy alias, case insensitive
      'jurisdiction', // Field, not metadata
    ]);
    expect(values).toEqual([
      'Workspace-1',
      'Workspace-1',
      'Workspace-1',
      'Workspace-1',
      'Workspace-1',
      'Workspace-1',
      'Wrong',
    ]);
  });

  test('should extract type', () => {
    const record = {
      case_type_id: 'Type1',
      data: {
        case_type_id: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[type]',
      '[TYPE]', // Case insensitive
      '[case_type]', // Legacy alias
      '[CASE_TYPE]', // Legacy alias, case insensitive
      'case_type_id', // Field, not metadata
    ]);
    expect(values).toEqual([
      'Type1',
      'Type1',
      'Type1',
      'Type1',
      'Wrong',
    ]);
  });

  test('should extract state', () => {
    const record = {
      state: 'inProgress',
      data: {
        state: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[state]',
      '[STATE]', // Case insensitive
      'state', // Field, not metadata
    ]);
    expect(values).toEqual([
      'inProgress',
      'inProgress',
      'Wrong',
    ]);
  });

  test('should extract ID', () => {
    const record = {
      id: '1111222233334444',
      data: {
        id: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[id]',
      '[ID]', // Case insensitive
      '[reference]', // Alias
      '[REFERENCE]', // Alias, case-insensitive
      '[case_reference]', // Legacy alias
      '[CASE_REFERENCE]', // Legacy alias, case-insensitive
      'id', // Field, not metadata
    ]);
    expect(values).toEqual([
      '1111222233334444',
      '1111222233334444',
      '1111222233334444',
      '1111222233334444',
      '1111222233334444',
      '1111222233334444',
      'Wrong',
    ]);
  });

  test('should extract security classification', () => {
    const record = {
      security_classification: 'PUBLIC',
      data: {
        security_classification: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[classification]',
      '[CLASSIFICATION]', // Case insensitive
      '[security_classification]', // Alias
      '[SECURITY_CLASSIFICATION]', // Alias, case-insensitive
      'security_classification', // Field, not metadata
    ]);
    expect(values).toEqual([
      'PUBLIC',
      'PUBLIC',
      'PUBLIC',
      'PUBLIC',
      'Wrong',
    ]);
  });

  test('should extract created date', () => {
    const record = {
      created_date: '2023-02-22T11:22:33.000Z',
      data: {
        created_date: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[created]',
      '[CREATED]', // Case insensitive
      '[created_date]', // Legacy alias
      '[CREATED_DATE]', // Legacy alias, case-insensitive
      'created_date', // Field, not metadata
    ]);
    expect(values).toEqual([
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      'Wrong',
    ]);
  });

  test('should extract created date', () => {
    const record = {
      last_modified: '2023-02-22T11:22:33.000Z',
      data: {
        last_modified: 'Wrong', // <-- Ignore, not metadata
      },
    };

    const values = extractor(record)([
      '[modified]',
      '[MODIFIED]', // Case insensitive
      '[last_modified]', // Alias
      '[LAST_MODIFIED]', // Alias, case-insensitive
      'last_modified', // Field, not metadata
    ]);
    expect(values).toEqual([
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      '2023-02-22T11:22:33.000Z',
      'Wrong',
    ]);
  });
});