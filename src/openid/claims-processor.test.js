import {quickcaseClaimsProcessor} from './claims-processor.js';

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
      }`,
      'app.quickcase.claims/default_jurisdiction': 'workspace-1',
      'app.quickcase.claims/default_case_type': 'type-1',
      'app.quickcase.claims/default_state': 'state-1',
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
      'defaultWorkspace': 'workspace-1',
      'defaultType': 'type-1',
      'defaultState': 'state-1',
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
      }`,
      'qc/default_jurisdiction': 'workspace-1',
      'qc/default_case_type': 'type-1',
      'qc/default_state': 'state-1',
    };

    const claims = quickcaseClaimsProcessor({
      names: {
        sub: 'qc/sub',
        name: 'qc/name',
        email: 'qc/email',
        roles: 'qc/roles',
        organisations: 'qc/organisations',
        defaultWorkspace: 'qc/default_jurisdiction',
        defaultType: 'qc/default_case_type',
        defaultState: 'qc/default_state',
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
      'defaultWorkspace': 'workspace-1',
      'defaultType': 'type-1',
      'defaultState': 'state-1',
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
      }`,
      'custom:app.quickcase.claims/default_jurisdiction': 'workspace-1',
      'custom:app.quickcase.claims/default_case_type': 'type-1',
      'custom:app.quickcase.claims/default_state': 'state-1',
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
      'defaultWorkspace': 'workspace-1',
      'defaultType': 'type-1',
      'defaultState': 'state-1',
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
      }`,
      'custom:default_jurisdiction': 'workspace-1',
      'custom:default_case_type': 'type-1',
      'custom:default_state': 'state-1',
    };

    const claims = quickcaseClaimsProcessor({
      prefix: 'custom:',
      names: {
        name: 'fullName',
        roles: 'roles',
        organisations: 'organisations',
        defaultWorkspace: 'default_jurisdiction',
        defaultType: 'default_case_type',
        defaultState: 'default_state',
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
      'defaultWorkspace': 'workspace-1',
      'defaultType': 'type-1',
      'defaultState': 'state-1',
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
