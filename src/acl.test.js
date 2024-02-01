import {check, checkAny, checkAll, CREATE, DELETE, READ, UPDATE} from './acl.js';

describe('check', () => {
  test('should return false when user has no roles', () => {
    const userRoles = [];
    const acl = [
      {role: 'role-1', create: true, read: true, update: true, delete: true},
    ];
    expect(check(READ)(userRoles)(acl)).toBe(false);
  });

  test('should return true when role and verb matched by at least one ACL item', () => {
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: false, read: false, update: false, delete: false},
      {role: 'role-2', create: true, read: true, update: true, delete: true},
    ];

    expect(check(CREATE)(userRoles)(acl)).toBeTruthy();
    expect(check(READ)(userRoles)(acl)).toBeTruthy();
    expect(check(UPDATE)(userRoles)(acl)).toBeTruthy();
    expect(check(DELETE)(userRoles)(acl)).toBeTruthy();
  });

  test('should return false when role matched but not verb', () => {
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: false, read: false, update: false, delete: false},
      {role: 'role-3', create: true, read: true, update: true, delete: true},
    ];

    expect(check(CREATE)(userRoles)(acl)).toBe(false);
    expect(check(READ)(userRoles)(acl)).toBe(false);
    expect(check(UPDATE)(userRoles)(acl)).toBe(false);
    expect(check(DELETE)(userRoles)(acl)).toBe(false);
  });

  test('should match verb from any valid role', () => {
    const userRoles = ['role-1', 'role-2', 'role-4'];
    const acl = [
      {role: 'role-1', create: true, read: false, update: false, delete: false},
      {role: 'role-2', create: false, read: true, update: false, delete: false},
      {role: 'role-3', create: false, read: false, update: true, delete: false},
      {role: 'role-4', create: false, read: false, update: false, delete: true},
    ];

    expect(check(CREATE)(userRoles)(acl)).toBeTruthy();
    expect(check(READ)(userRoles)(acl)).toBeTruthy();
    expect(check(UPDATE)(userRoles)(acl)).toBe(false); // No role-3
    expect(check(DELETE)(userRoles)(acl)).toBeTruthy();
  });

  test('should return effective permission matched', () => {
    const userRoles = ['role-1', 'role-3'];
    const acl = [
      {role: 'role-1', create: true, read: false, update: false, delete: false},
      {role: 'role-2', create: false, read: true, update: true, delete: false},
      {role: 'role-3', create: false, read: false, update: true, delete: false},
      {role: 'role-4', create: false, read: false, update: false, delete: true},
    ];

    const permission = check(UPDATE)(userRoles)(acl);
    expect(permission).toBe(acl[2]);
  });
});

describe('checkAny', () => {
  test('should return false when user has no roles', () => {
    const verbs = [CREATE, READ];
    const userRoles = [];
    const acl = [
      {role: 'role-1', create: true, read: true, update: true, delete: true},
    ];
    expect(checkAny(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return false when no verb matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: false, read: false, update: true, delete: false},
      {role: 'role-2', create: false, read: false, update: false, delete: true},
    ];

    expect(checkAny(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return true when any verb matched for one role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: false, read: false, update: false, delete: false},
      {role: 'role-2', create: false, read: true, update: false, delete: false},
    ];

    expect(checkAny(verbs)(userRoles)(acl)).toBeTruthy();
  });

  test('should return effective permission matched', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-3'];
    const acl = [
      {role: 'role-1', create: false, read: false, update: false, delete: true},
      {role: 'role-2', create: true, read: true, update: true, delete: false},
      {role: 'role-3', create: false, read: true, update: false, delete: false},
    ];

    const permission = checkAny(verbs)(userRoles)(acl);
    expect(permission).toBe(acl[2]);
  });
});

describe('checkAll', () => {
  test('should return false when user has no roles', () => {
    const verbs = [CREATE, READ];
    const userRoles = [];
    const acl = [
      {role: 'role-1', create: true, read: true, update: true, delete: true},
    ];
    expect(checkAll(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return false when some verbs not matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: true, read: false, update: true, delete: false},
      {role: 'role-2', create: false, read: false, update: false, delete: true},
    ];

    expect(checkAll(verbs)(userRoles)(acl)).toBe(false);
  });

  test('should return true when all verbs matched for any role', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-2'];
    const acl = [
      {role: 'role-1', create: true, read: false, update: false, delete: false},
      {role: 'role-2', create: false, read: true, update: false, delete: false},
    ];

    expect(checkAll(verbs)(userRoles)(acl)).toBeTruthy();
  });

  test('should return effective permission matched', () => {
    const verbs = [CREATE, READ];
    const userRoles = ['role-1', 'role-3'];
    const acl = [
      {role: 'role-1', create: true, read: false, update: false, delete: true},
      {role: 'role-2', create: true, read: true, update: true, delete: false},
      {role: 'role-3', create: false, read: true, update: false, delete: false},
    ];

    const permission = checkAll(verbs)(userRoles)(acl);
    expect(permission).toEqual({
      create: 'role-1',
      read: 'role-3',
    });
  });
});
