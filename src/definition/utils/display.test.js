import {normaliseDisplay} from './display.js';

describe('normaliseDisplay', () => {
  test('should return empty object when no display mode/params', () => {
    const field = {
      id: 'field1',
    };

    expect(normaliseDisplay(field)).toEqual({});
  });

  test('should normalise display when mode set', () => {
    const field = {
      id: 'field1',
      display_mode: 'select',
    };

    expect(normaliseDisplay(field)).toEqual({
      display: {
        mode: 'select'
      },
    });
  });

  test('should normalise display when params set', () => {
    const field = {
      id: 'field1',
      display_mode_parameters: {
        key1: 'value1',
      },
    };

    expect(normaliseDisplay(field)).toEqual({
      display: {
        parameters: {
          key1: 'value1',
        }
      },
    });
  });

  test('should normalise display when mode and params set', () => {
    const field = {
      id: 'field1',
      display_mode: 'select',
      display_mode_parameters: {
        key1: 'value1',
      },
    };

    expect(normaliseDisplay(field)).toEqual({
      display: {
        mode: 'select',
        parameters: {
          key1: 'value1',
        }
      },
    });
  });

  test('should normalise alternative display syntax', () => {
    const field = {
      id: 'field1',
      displayMode: 'select',
      displayModeParameters: {
        key1: 'value1',
      },
    };

    expect(normaliseDisplay(field)).toEqual({
      display: {
        mode: 'select',
        parameters: {
          key1: 'value1',
        }
      },
    });
  });
});
