import {asBoolean, asNumber, asString, nullOr, raw, shorthand} from './config.js';

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: (property) => ({
      'level1.level2.null': null,
      'level1.level2.raw': 42,
      'level1.level2.number': '1337',
      'level1.level2.true': true,
      'level1.level2.trueStr': 'true',
      'level1.level2.false': 'notTrue',
    })[property],
  },
}));

describe('raw', () => {
  test('should extract raw value', () => {
    expect(raw('level1.level2.raw')).toBe(42);
  });
});

describe('asBoolean', () => {
  test('should extract value as `true` when raw boolean true', () => {
    expect(asBoolean('level1.level2.true')).toBe(true);
  });

  test('should extract value as `true` when case-insensitive exact match string', () => {
    expect(asBoolean('level1.level2.trueStr')).toBe(true);
  });

  test('should extract value as `false` when not true match', () => {
    expect(asBoolean('level1.level2.false')).toBe(false);
    expect(asBoolean('level1.level2.raw')).toBe(false);
    expect(asBoolean('level1.level2.null')).toBe(false);
  });
});

describe('asNumber', () => {
  test('should extract value as number', () => {
    expect(asNumber('level1.level2.number')).toBe(1337);
  });
});

describe('asString', () => {
  test('should extract value as string', () => {
    expect(asString('level1.level2.null')).toBe('null');
    expect(asString('level1.level2.raw')).toBe('42');
  });
});

describe('nullOr', () => {
  test('should return null when raw value is null', () => {
    expect(nullOr(asString)('level1.level2.null')).toBe(null);
  });

  test('should return type valued when raw value is not null', () => {
    expect(nullOr(asString)('level1.level2.raw')).toBe('42');
  });
});

describe('shorthand', () => {
  test('should extract prefixed property', () => {
    const level2 = shorthand('level1.level2.');
    expect(level2('trueStr')).toBe('true');
  });

  test('should extract properties using `nullOr(asString)` by default', () => {
    const level1 = shorthand('level1.');
    expect(level1('level2.null')).toBe(null);
    expect(level1('level2.raw')).toBe('42');
  });

  test('should extract properties using provided typeFn', () => {
    const level2 = shorthand('level1.level2.');
    expect(level2('raw', asString)).toBe('42');
    expect(level2('raw', asNumber)).toBe(42);
  });
});
