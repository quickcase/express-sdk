import {TokenSet} from 'openid-client';
import {authenticateFromSession, defaultTokenSetIntrospector} from './authenticate.js';

describe('defaultTokenSetIntrospector', () => {
  test('should not be active when `expires_at` in the past', async () => {
    const tokenSet = new TokenSet({
      access_token: '123',
    });
    const introspect = defaultTokenSetIntrospector({});

    tokenSet.expires_in = -60;

    await expect(introspect(tokenSet)).resolves.toBe(false);
  });

  test('should be active when `expires_at` in future', async () => {
    const tokenSet = new TokenSet({
      access_token: '123',
    });
    const introspect = defaultTokenSetIntrospector({});

    tokenSet.expires_in = 60;

    await expect(introspect(tokenSet)).resolves.toBe(true);
  });

  test('should not be active when no `expires_at` and introspection `active` flag is false', async () => {
    const tokenSet = new TokenSet({
      access_token: '123',
    });
    const client = {
      introspect: jest.fn().mockResolvedValue({active: false}),
    };
    const introspect = defaultTokenSetIntrospector({client});

    await expect(introspect(tokenSet)).resolves.toBe(false);
    expect(client.introspect).toHaveBeenCalledWith('123', 'access_token');
  });

  test('should be active when no `expires_at` and introspection `active` flag is true', async () => {
    const tokenSet = new TokenSet({
      access_token: '123',
    });
    const client = {
      introspect: jest.fn().mockResolvedValue({active: true}),
    };
    const introspect = defaultTokenSetIntrospector({client});

    await expect(introspect(tokenSet)).resolves.toBe(true);
    expect(client.introspect).toHaveBeenCalledTimes(1);
  });

  test('should not be active when introspection fails', async () => {
    const tokenSet = new TokenSet({
      access_token: '123',
    });
    const client = {
      introspect: jest.fn().mockRejectedValue(new Error('introspection error')),
    };
    const introspect = defaultTokenSetIntrospector({client});

    await expect(introspect(tokenSet)).resolves.toBe(false);
    expect(client.introspect).toHaveBeenCalledTimes(1);
  });
});

describe('authenticateFromSession', () => {
  const fromSession = (session) => ({session});
  const fromOpenIdSession = (openId) => fromSession({openId});

  [
    undefined,
    {},
    {openId: null},
    {openId: 'xxx'},
    {openId: {tokenSet: null}},
    {openId: {tokenSet: 'xxx'}},
  ].forEach(session => {
    test(`should not be authenticated when invalid openId session: ${JSON.stringify(session)}`, async () => {
      const authenticate = authenticateFromSession({});

      const req = fromSession(session);

      await expect(authenticate(req)).resolves.toEqual({
        authenticated: false,
        error: 'no_session',
        errorDescription: 'No session found',
      });
    });
  });

  test('should not be authenticated when no access token', async () => {
    const authenticate = authenticateFromSession({});

    const req = fromOpenIdSession({tokenSet: {token_type: 'Bearer'}});

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: false,
      error: 'no_token',
      errorDescription: 'No access token in session',
    });
  });

  test('should not be authenticated when access token not active and no refresh token', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(false),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: false,
      error: 'expired_token',
      errorDescription: 'Access token is expired',
    });
  });

  test('should be authenticated when access token is active', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(true),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: true,
    });
  });

  test('should refresh token set when access token not active', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(false),
      tokenSetRefresher: jest.fn().mockResolvedValue({
        access_token: 'new-access-token',
        expires_at: 9999999999999,
        id_token: 'new-id-token',
        refresh_token: '789',
      }),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
        id_token: 'id-123',
        refresh_token: '456',
        expires_at: 1,
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: true,
    });

    expect(req.session.openId.tokenSet).toEqual({
      access_token: 'new-access-token',
      expires_at: 9999999999999,
      id_token: 'new-id-token',
      refresh_token: '789',
    });
  });

  test('should preserve id_token when missing from refreshed token set', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(false),
      tokenSetRefresher: jest.fn().mockResolvedValue({
        access_token: 'new-access-token',
        expires_at: 9999999999999,
        refresh_token: 'new-refresh-token',
      }),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
        id_token: 'id-123',
        refresh_token: '456',
        expires_at: 1,
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: true,
    });

    expect(req.session.openId.tokenSet).toEqual({
      access_token: 'new-access-token',
      expires_at: 9999999999999,
      id_token: 'id-123',
      refresh_token: 'new-refresh-token',
    });
  });

  test('should preserve refresh_token when missing from refreshed token set', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(false),
      tokenSetRefresher: jest.fn().mockResolvedValue({
        access_token: 'new-access-token',
        expires_at: 9999999999999,
        id_token: 'new-id-token',
      }),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
        id_token: 'id-123',
        refresh_token: '456',
        expires_at: 1,
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: true,
    });

    expect(req.session.openId.tokenSet).toEqual({
      access_token: 'new-access-token',
      expires_at: 9999999999999,
      id_token: 'new-id-token',
      refresh_token: '456',
    });
  });

  test('should not be authenticated when refresh fails', async () => {
    const authenticate = authenticateFromSession({
      tokenSetIntrospector: jest.fn().mockResolvedValue(false),
      tokenSetRefresher: jest.fn().mockRejectedValue(new Error('Failed to refresh')),
    });

    const req = fromOpenIdSession({
      tokenSet: {
        access_token: '123',
        refresh_token: '456',
        expires_at: 1,
      },
    });

    await expect(authenticate(req)).resolves.toEqual({
      authenticated: false,
      error: 'failed_refresh',
      errorDescription: 'The authorization server rejected the refresh request',
    });
  });
});
