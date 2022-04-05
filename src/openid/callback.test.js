import {givenMiddleware} from '@quickcase/node-toolkit/test';
import {errors} from 'openid-client';
import {callbackMiddleware} from './callback';
import {
  NoActiveAuthenticationError,
  OpenIdError,
  ProviderError,
  RelyingPartyError,
} from './errors';

const config = {
  redirectUri: 'http://itself/oauth2',
};

const deps = {
  callbackParamsSupplier: (req) => ({code: req.query.code, state: req.query.state}),
  callbackHandler: (redirectUri, params, checks) => Promise.resolve({
    access_token: 'token-123',
    redirectUri,
    params,
    checks,
  }),
};

test('should redirect to index when no path saved in session', async () => {
  const middleware = callbackMiddleware(deps)(config);

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
  const middleware = callbackMiddleware(deps)(config);

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

  expect(req.session.openId).toEqual({
    tokenSet: {
      access_token: 'token-123',
      redirectUri: 'http://itself/oauth2',
      params: {
        code: '1-code',
        state: '2-state',
      },
      checks: {
        response_type: 'code',
        state: '3-state',
        nonce: '4-nonce',
      },
    },
  });
});

test('should check maxAge when set in authentication', async () => {
  const callbackHandler = jest.fn();
  const middleware = callbackMiddleware({
    ...deps,
    callbackHandler,
  })(config);

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

  expect(callbackHandler).toHaveBeenCalledWith(expect.anything(),
                                               expect.anything(),
                                               expect.objectContaining({max_age: 360}));
});

test('should error when no authentication in session', async () => {
  const middleware = callbackMiddleware(deps)(config);

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
  const middleware = callbackMiddleware(deps)(config);

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
  const middleware = callbackMiddleware({
    ...deps,
    callbackHandler: () => Promise.reject(new errors.RPError('Failed checks')),
  })(config);

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
  const middleware = callbackMiddleware({
    ...deps,
    callbackHandler: () => Promise.reject(new errors.OPError({error: 'login_required'})),
  })(config);

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
  const middleware = callbackMiddleware({
    ...deps,
    callbackHandler: () => Promise.reject(new Error('some error')),
  })(config);

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
