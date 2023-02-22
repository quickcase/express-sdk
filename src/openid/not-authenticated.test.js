import {givenMiddleware} from '../test';
import {reject401, startAuth302} from './not-authenticated';

describe('reject401', () => {
  test('should respond with 401 error', async () => {
    const req = {};
    const res = await givenMiddleware(reject401()).when(req).expectResponse();

    expect(res.status).toBe(401);
  });

  test('should populate the WWW-Authenticate header', async () => {
    const req = {};
    const res = await givenMiddleware(reject401()).when(req).expectResponse();

    expect(res.headers['WWW-Authenticate']).toBe('Bearer ');
  });

  test('should populate the WWW-Authenticate header with provided error', async () => {
    const req = {};
    const auth = {
      authenticated: false,
      error: 'invalid_token',
      errorDescription: 'The access token expired',
    };
    const res = await givenMiddleware(reject401(auth)).when(req).expectResponse();

    expect(res.headers['WWW-Authenticate']).toBe('Bearer error="invalid_token", error_description="The access token expired"');
  });
});

describe('startAuth302', () => {
  const STATE = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  const NONCE = 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy';

  const defaultDeps = Object.freeze({
    stateGenerator: () => STATE,
    nonceGenerator: () => NONCE,
    promptSupplier: () => undefined,
    authorizationUrlSupplier: () => '',
  });

  const options = Object.freeze({
    disableLoginHint: false,
    disableNonce: false,
    scope: 'openid profile email quickcase',
  });

  test('should redirect to authorization uri', async () => {
    const deps = {
      ...defaultDeps,
      authorizationUrlSupplier: jest.fn().mockReturnValue('https://idp:9999/authorize'),
    };
    const middleware = startAuth302(deps)(options)();

    const req = {session: {}};
    const res = await givenMiddleware(middleware).when(req).expectResponse();

    expect(res.status).toBe(302);
    expect(res.redirect).toEqual('https://idp:9999/authorize');
    expect(deps.authorizationUrlSupplier).toHaveBeenCalledWith({
      nonce: NONCE,
      scope: options.scope,
      state: STATE,
    });
  });

  test('should save authentication context in session', async () => {
    const middleware = startAuth302(defaultDeps)(options)();

    const req = {
      originalUrl: '/path/to/resource',
      session: {
        openId: {
          claims: {sub: '123'},
        }
      },
    };

    await givenMiddleware(middleware).when(req).expectResponse();

    expect(req.session).toEqual({
      openId: {
        authentication: {
          nonce: NONCE,
          state: STATE,
          redirectTo: '/path/to/resource',
        },
        claims: {sub: '123'},
      },
    });
  });

  test('should ignore nonce when disabled', async () => {
    const deps = {
      ...defaultDeps,
      authorizationUrlSupplier: jest.fn(),
    };
    const middleware = startAuth302(deps)({
      ...options,
      disableNonce: true,
    })();

    const req = {
      originalUrl: '/path/to/resource',
      session: {},
    };

    await givenMiddleware(middleware).when(req).expectResponse();

    expect(deps.authorizationUrlSupplier).toHaveBeenCalledWith({
      state: STATE,
      scope: options.scope,
    });
    expect(req.session).toEqual({
      openId: {
        authentication: {
          state: STATE,
          redirectTo: '/path/to/resource',
        },
      },
    });
  });

  const testAuthorizationUrl = (options) => (auth = {}) => async (session = {}) => {
    const deps = {
      ...defaultDeps,
      authorizationUrlSupplier: jest.fn(),
    };
    const middleware = startAuth302(deps)(options)(auth);

    const req = {session};

    await givenMiddleware(middleware).when(req).expectResponse();

    return deps.authorizationUrlSupplier;
  }

  test('should populate `login_hint` when enabled with claim', async () => {
    const config = {
      ...options,
      loginHint: {
        enable: true,
        claim: 'something',
      }
    };
    const session = {
      openId: {
        claims: {
          something: 'test@quickcase.app'
        }
      }
    };
    const authorizationUrlSupplier = await testAuthorizationUrl(config)()(session);

    expect(authorizationUrlSupplier).toHaveBeenCalledWith(
      expect.objectContaining({login_hint: 'test@quickcase.app'})
    );
  });

  test('should not populate `login_hint` when claim undefined', async () => {
    const config = {
      ...options,
      loginHint: {
        enable: true,
        claim: 'other',
      }
    };
    const session = {
      openId: {
        claims: {
          something: 'test@quickcase.app'
        }
      }
    };
    const authorizationUrlSupplier = await testAuthorizationUrl(config)()(session);

    expect(authorizationUrlSupplier).toHaveBeenCalledWith(
      expect.objectContaining({login_hint: undefined})
    );
  });

  test('should not populate `login_hint` when not enabled', async () => {
    const config = {
      ...options,
      loginHint: {
        enable: false,
        claim: 'email',
      }
    };
    const session = {
      openId: {
        claims: {
          email: 'test@quickcase.app'
        }
      }
    };
    const authorizationUrlSupplier = await testAuthorizationUrl(config)()(session);

    expect(authorizationUrlSupplier).toHaveBeenCalledWith(
      expect.objectContaining({login_hint: undefined})
    );
  });

  test('should populate prompt with value returned by supplier', async () => {
    const deps = {
      ...defaultDeps,
      promptSupplier: jest.fn().mockReturnValue('login consent'),
      authorizationUrlSupplier: jest.fn(),
    };
    const auth = {error: 'expired_token'};
    const middleware = startAuth302(deps)(options)(auth);

    const req = {session: {}};

    await givenMiddleware(middleware).when(req).expectResponse();

    expect(deps.promptSupplier).toHaveBeenCalledWith(auth);
    expect(deps.authorizationUrlSupplier).toHaveBeenCalledWith(
      expect.objectContaining({prompt: 'login consent'})
    );
  });

  test('should populate max age when configured', async () => {
    const deps = {
      ...defaultDeps,
      authorizationUrlSupplier: jest.fn(),
    };
    const middleware = startAuth302(deps)({
      ...options,
      maxAge: 360,
    })();

    const req = {
      originalUrl: '/path/to/resource',
      session: {},
    };

    await givenMiddleware(middleware).when(req).expectResponse();

    expect(deps.authorizationUrlSupplier).toHaveBeenCalledWith(
      expect.objectContaining({max_age: 360})
    );
    expect(req.session).toEqual({
      openId: {
        authentication: {
          state: STATE,
          nonce: NONCE,
          maxAge: 360,
          redirectTo: '/path/to/resource',
        },
      },
    });
  });
});
