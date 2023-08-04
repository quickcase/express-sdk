import {check, checkAll, checkAny, CREATE, CRUD, DELETE, fromLegacy, READ, toBinary, UPDATE} from './acl-v2';

describe('check()', () => {
  test('should return false when user has no roles', () => {
    const userRoles = [];
    const acl = {'role-1': CRUD};
    expect(check(READ)(userRoles)(acl)).toBe(false);
  });

  test('should return true when role and verb matched by at least one ACL item', () => {
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': 0,
      'role-2': CRUD,
    };

    expect(check(CREATE)(userRoles)(acl)).toBeTruthy();
    expect(check(READ)(userRoles)(acl)).toBeTruthy();
    expect(check(UPDATE)(userRoles)(acl)).toBeTruthy();
    expect(check(DELETE)(userRoles)(acl)).toBeTruthy();
  });

  test('should return false when role matched but not verb', () => {
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': 0,
      'role-3': CRUD,
    };

    expect(check(CREATE)(userRoles)(acl)).toBe(false);
    expect(check(READ)(userRoles)(acl)).toBe(false);
    expect(check(UPDATE)(userRoles)(acl)).toBe(false);
    expect(check(DELETE)(userRoles)(acl)).toBe(false);
  });

  test('should match verb from any valid role', () => {
    const userRoles = ['role-1', 'role-2', 'role-4'];
    const acl = {
      'role-1': CREATE,
      'role-2': READ,
      'role-3': UPDATE,
      'role-4': DELETE,
    };

    expect(check(CREATE)(userRoles)(acl)).toBeTruthy();
    expect(check(READ)(userRoles)(acl)).toBeTruthy();
    expect(check(UPDATE)(userRoles)(acl)).toBe(false); // No role-3
    expect(check(DELETE)(userRoles)(acl)).toBeTruthy();
  });

  test('should return effective role granting permission', () => {
    const userRoles = ['role-1', 'role-3'];
    const acl = {
      'role-1': CREATE,
      'role-2': READ | UPDATE,
      'role-3': UPDATE,
      'role-4': DELETE,
    };

    const permission = check(UPDATE)(userRoles)(acl);
    expect(permission).toBe('role-3');
  });
});

describe('checkAny()', () => {
  test('should return false when user has no roles', () => {
    const verbs = [CREATE, READ];
    const userRoles = [];
    const acl = {
      'role-1': CRUD,
    };
    expect(checkAny(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return false when no verb matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': UPDATE,
      'role-2': DELETE,
    };

    expect(checkAny(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return true when any verb matched for one role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': 0,
      'role-2': READ,
    };

    expect(checkAny(verbs)(userRoles)(acl)).toBeTruthy();
  });

  test('should return effective role granting permission', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-3'];
    const acl = {
      'role-1': DELETE,
      'role-2': CREATE | READ | UPDATE,
      'role-3': READ,
    };

    const permission = checkAny(verbs)(userRoles)(acl);
    expect(permission).toBe('role-3');
  });
});

describe('checkAll()', () => {
  test('should return false when user has no roles', () => {
    const verbs = [CREATE, READ];
    const userRoles = [];
    const acl = {
      'role-1': CRUD,
    };
    expect(checkAll(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return false when some verbs not matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': CREATE | UPDATE,
      'role-2': DELETE,
    };

    expect(checkAll(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return true when all verbs matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = {
      'role-1': CREATE,
      'role-2': READ,
    };

    expect(checkAll(verbs)(userRoles)(acl)).toBeTruthy();
  });

  test('should return combination of effective roles granting permission', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-3'];
    const acl = {
      'role-1': CREATE | DELETE,
      'role-2': CREATE | READ | UPDATE,
      'role-3': READ,
    };

    const permission = checkAll(verbs)(userRoles)(acl);
    expect(permission).toEqual(['role-1', 'role-3']);
  });
});

describe('toBinary()', () => {
  test('should return 0 when permission is null', () => {
    expect(toBinary(null)).toEqual(0);
  });

  test.each([
    [{create: true, read: false, update: false, delete: false}, CREATE],
    [{create: false, read: true, update: false, delete: false}, READ],
    [{create: false, read: false, update: true, delete: false}, UPDATE],
    [{create: false, read: false, update: false, delete: true}, DELETE],
    [{create: true, read: true, update: false, delete: false}, CREATE | READ],
    [{create: false, read: true, update: true, delete: false}, READ | UPDATE],
    [{create: true, read: true, update: true, delete: true}, CRUD],
    [{create: false, read: false, update: false, delete: false}, 0],
  ])('should convert permission object to binary: %o', (permission, binary) => {
    expect(toBinary(permission)).toEqual(binary);
  });

  test.each([
    ['C', CREATE],
    ['R', READ],
    ['U', UPDATE],
    ['D', DELETE],
    ['CR', CREATE | READ],
    ['RU', READ | UPDATE],
    ['CRUD', CRUD],
    ['DUCR', CRUD],
    ['', 0],
  ])('should convert permission string to binary: %s', (permission, binary) => {
    expect(toBinary(permission)).toEqual(binary);
  });
});

describe('fromLegacy()', () => {
  test('should convert from legacy ACL', () => {
    const legacyAcl = [
      {role: 'role-C', create: true, read: false, update: false, delete: false},
      {role: 'role-R', create: false, read: true, update: false, delete: false},
      {role: 'role-U', create: false, read: false, update: true, delete: false},
      {role: 'role-D', create: false, read: false, update: false, delete: true},
      {role: 'role-CR', create: true, read: true, update: false, delete: false},
      {role: 'role-RU', create: false, read: true, update: true, delete: false},
      {role: 'role-CRUD', create: true, read: true, update: true, delete: true},
      {role: 'role-none', create: false, read: false, update: false, delete: false},
    ];

    expect(fromLegacy(legacyAcl)).toEqual({
      'role-C': CREATE,
      'role-R': READ,
      'role-U': UPDATE,
      'role-D': DELETE,
      'role-CR': CREATE | READ,
      'role-RU': READ | UPDATE,
      'role-CRUD': CRUD,
      'role-none': 0,
    });
  });
});