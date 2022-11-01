import {givenMiddleware} from '@quickcase/node-toolkit/test';
import {errors, TokenSet} from 'openid-client';
import {callbackMiddleware} from './callback';
import {
  NoActiveAuthenticationError,
  OpenIdError,
  ProviderError,
  RelyingPartyError,
} from './errors';

const ID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJlbWFpbCI6ImpvaG4uZG9lQHF1aWNrY2FzZS5hcHAifQ.WvO_bQbHZk3JuYf1RuMld0eYvxPYsbUyt2NioN6egPM';
const TOKEN_SET = {
  access_token: 'token-123',
  id_token: ID_TOKEN,
  token_type: 'Bearer',
  expires_at: 1667324793,
};

const config = {
  redirectUri: 'http://itself/oauth2',
};

const mockDeps = (overrides = {}) => ({
  callbackParamsSupplier: jest.fn().mockImplementationOnce((req) => ({code: req.query.code, state: req.query.state})),
  callbackHandler: jest.fn().mockResolvedValueOnce(new TokenSet(TOKEN_SET)),
  ...overrides,
});

test('should redirect to index when no path saved in session', async () => {
  const middleware = callbackMiddleware(mockDeps())(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          state: 'some state',
          // No `redirectTo`
        },
      },
    }
  };
  const res = await givenMiddleware(middleware).when(req).expectResponse();

  expect(res.status).toBe(302);
  expect(res.redirect).toEqual('/');
});

test('should redirect to path saved in session', async () => {
  const middleware = callbackMiddleware(mockDeps())(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          state: 'some state',
          redirectTo: '/path/to/resource',
        },
      },
    }
  };
  const res = await givenMiddleware(middleware).when(req).expectResponse();

  expect(res.status).toBe(302);
  expect(res.redirect).toEqual('/path/to/resource');
});

test('should handle callback, save tokenSet in session and clear authentication context', async () => {
  const deps = mockDeps();
  const middleware = callbackMiddleware(deps)(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          state: '3-state',
          nonce: '4-nonce',
        },
      },
    }
  };

  await givenMiddleware(middleware).when(req).expectResponse();

  expect(deps.callbackHandler).toHaveBeenCalledTimes(1);
  expect(deps.callbackHandler).toHaveBeenLastCalledWith(config.redirectUri, req.query, {
    response_type: 'code',
    nonce: '4-nonce',
    state: '3-state',
  });

  expect(req.session.openId.tokenSet).toEqual(TOKEN_SET);
  expect(req.session.openId.authentication).toBe(undefined);
});

test('should extract and save OpenID claims in session when id_token present', async () => {
  const middleware = callbackMiddleware(mockDeps())(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          state: '3-state',
          nonce: '4-nonce',
        },
      },
    }
  };

  await givenMiddleware(middleware).when(req).expectResponse();

  expect(req.session.openId.claims).toEqual({
    sub: '123',
    name: 'John Doe',
    email: 'john.doe@quickcase.app',
  });
});

test('should default OpenID claims to empty object when id_token missing', async () => {
  const callbackHandler = jest.fn().mockResolvedValue(new TokenSet({...TOKEN_SET, id_token: null}));
  const middleware = callbackMiddleware(mockDeps({callbackHandler}))(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          state: '3-state',
          nonce: '4-nonce',
        },
      },
    }
  };

  await givenMiddleware(middleware).when(req).expectResponse();

  expect(req.session.openId.claims).toEqual({});
});

test('should check maxAge when set in authentication', async () => {
  const deps = mockDeps();
  const middleware = callbackMiddleware(deps)(config);

  const req = {
    query: {},
    session: {
      openId: {
        authentication: {
          state: 'some-state',
          maxAge: 360,
        },
      },
    }
  };

  await givenMiddleware(middleware).when(req).expectResponse();

  expect(deps.callbackHandler).toHaveBeenCalledWith(expect.anything(),
                                                    expect.anything(),
                                                    expect.objectContaining({max_age: 360}));
});

test('should error when no authentication in session', async () => {
  const middleware = callbackMiddleware(mockDeps())(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        // No authentication
      },
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(next).toBeInstanceOf(NoActiveAuthenticationError);
  expect(next).toEqual(new NoActiveAuthenticationError('No active authentication found in session'));
});

test('should error when no state in session authentication', async () => {
  const middleware = callbackMiddleware(mockDeps())(config);

  const req = {
    query: {
      code: '1-code',
      state: '2-state',
    },
    session: {
      openId: {
        authentication: {
          // No state
        }
      },
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(next).toBeInstanceOf(NoActiveAuthenticationError);
  expect(next).toEqual(new NoActiveAuthenticationError('No state found in active authentication session'));
});

test('should handle RPError from callback handler', async () => {
  const deps = mockDeps({
    callbackHandler: () => Promise.reject(new errors.RPError('Failed checks')),
  });
  const middleware = callbackMiddleware(deps)(config);

  const req = {
    query: {},
    session: {
      openId: {
        authentication: {
          state: 'some state',
        }
      },
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(next).toBeInstanceOf(RelyingPartyError);
  expect(next.message).toEqual('Failed checks');
});

test('should handle OPError from callback handler', async () => {
  const deps = mockDeps({
    callbackHandler: () => Promise.reject(new errors.OPError({error: 'login_required'})),
  });
  const middleware = callbackMiddleware(deps)(config);

  const req = {
    query: {},
    session: {
      openId: {
        authentication: {
          state: 'some state',
        }
      },
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(next).toBeInstanceOf(ProviderError);
  expect(next).toEqual(new ProviderError({error: 'login_required'}));
});

test('should handle any error from callback handler', async () => {
  const deps = mockDeps({
    callbackHandler: () => Promise.reject(new Error('some error')),
  });
  const middleware = callbackMiddleware(deps)(config);

  const req = {
    query: {},
    session: {
      openId: {
        authentication: {
          state: 'some state',
        }
      },
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(next).toBeInstanceOf(OpenIdError);
  expect(next).toEqual(new OpenIdError(undefined, {message: 'some error'}));
});
