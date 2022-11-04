import {quickcaseClaimsProcessor} from './claims-processor';

describe('quickcaseClaimsProcessor', () => {
  test('should normalise and parse claims from default names when no config', () => {
    const rawClaims = {
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'app.quickcase.claims/roles': 'role1,role2,role3',
      'app.quickcase.claims/organisations': `{
        "org-1": {"access": "organisation", "classification": "private"},
        "org-2": {"access": "group", "classification": "public", "group": "group-1"}
      }`
    };

    const claims = quickcaseClaimsProcessor()(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'roles': ['role1', 'role2', 'role3'],
      'organisations': {
        'org-1': {access: 'organisation', classification: 'private'},
        'org-2': {access: 'group', classification: 'public', group: 'group-1'},
      },
    }));
  });

  test('should respect custom claims names', () => {
    const rawClaims = {
      'qc/sub': '123',
      'qc/name': 'John Doe',
      'qc/email': 'john.doe@quickcase.app',
      'qc/roles': 'role1,role2,role3',
      'qc/organisations': `{
        "org-1": {"access": "organisation", "classification": "private"},
        "org-2": {"access": "group", "classification": "public", "group": "group-1"}
      }`
    };

    const claims = quickcaseClaimsProcessor({
      names: {
        sub: 'qc/sub',
        name: 'qc/name',
        email: 'qc/email',
        roles: 'qc/roles',
        organisations: 'qc/organisations',
      },
    })(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'roles': ['role1', 'role2', 'role3'],
      'organisations': {
        'org-1': {access: 'organisation', classification: 'private'},
        'org-2': {access: 'group', classification: 'public', group: 'group-1'},
      },
    }));
  });

  test('should apply prefix to non-standard claims', () => {
    const rawClaims = {
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'custom:app.quickcase.claims/roles': 'role1,role2,role3',
      'custom:app.quickcase.claims/organisations': `{
        "org-1": {"access": "organisation", "classification": "private"},
        "org-2": {"access": "group", "classification": "public", "group": "group-1"}
      }`
    };

    const claims = quickcaseClaimsProcessor({
      prefix: 'custom:',
    })(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'roles': ['role1', 'role2', 'role3'],
      'organisations': {
        'org-1': {access: 'organisation', classification: 'private'},
        'org-2': {access: 'group', classification: 'public', group: 'group-1'},
      },
    }));
  });

  test('combine both prefix and name overrides when both provided', () => {
    const rawClaims = {
      'sub': '123',
      'fullName': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'custom:roles': 'role1,role2,role3',
      'custom:organisations': `{
        "org-1": {"access": "organisation", "classification": "private"},
        "org-2": {"access": "group", "classification": "public", "group": "group-1"}
      }`
    };

    const claims = quickcaseClaimsProcessor({
      prefix: 'custom:',
      names: {
        name: 'fullName',
        roles: 'roles',
        organisations: 'organisations',
      },
    })(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'name': 'John Doe',
      'email': 'john.doe@quickcase.app',
      'roles': ['role1', 'role2', 'role3'],
      'organisations': {
        'org-1': {access: 'organisation', classification: 'private'},
        'org-2': {access: 'group', classification: 'public', group: 'group-1'},
      },
    }));
  });

  test('should extract roles as empty array when null', () => {
    const rawClaims = {
      'sub': '123',
    };

    const claims = quickcaseClaimsProcessor({})(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'roles': [],
    }));
  });

  test('should extract organisations as empty object when null', () => {
    const rawClaims = {
      'sub': '123',
    };

    const claims = quickcaseClaimsProcessor({})(rawClaims);

    expect(claims).toEqual(expect.objectContaining({
      'sub': '123',
      'organisations': {},
    }));
  });
});