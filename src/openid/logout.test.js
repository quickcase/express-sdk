import {givenMiddleware} from '../test/index.js';
import {logoutMiddleware} from './logout.js';

const deps = {
  endSessionUrlSupplier: ({id_token_hint}) => `http://op/session/end?id_token_hint=${id_token_hint}`,
};

test('should destroy session and call next middleware when no ID token in session (ie. session expired)', async () => {
  const middleware = logoutMiddleware(deps)();

  const req = {
    session: {
      destroy: jest.fn((cb) => cb()),
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(req.session.destroy).toHaveBeenCalledTimes(1);
  expect(next).toBeUndefined(); // No errors
});

test('should silently handle session destruction error', async () => {
  const middleware = logoutMiddleware(deps)();

  const req = {
    session: {
      id: '123',
      destroy: jest.fn((cb) => cb(new Error('Session could not be destroyed'))),
    }
  };

  const next = await givenMiddleware(middleware).when(req).expectNext();

  expect(req.session.destroy).toHaveBeenCalledTimes(1);
  expect(next).toBeUndefined();
});

test('should destroy session and redirect to end session URL when ID token in session', async () => {
  const middleware = logoutMiddleware(deps)();

  const req = {
    session: {
      destroy: jest.fn((cb) => cb()),
      openId: {
        tokenSet: {
          id_token: 'id-token-123',
        },
      },
    }
  };

  const res = await givenMiddleware(middleware).when(req).expectResponse();

  expect(res.status).toEqual(302);
  expect(res.redirect).toEqual('http://op/session/end?id_token_hint=id-token-123');
});

test('should destroy session and redirect to end session URL when RP-initiated logout forced', async () => {
  const middleware = logoutMiddleware(deps)({
    forceRpInitiatedLogout: true,
  });

  const req = {
    session: {
      destroy: jest.fn((cb) => cb()),
    }
  };

  const res = await givenMiddleware(middleware).when(req).expectResponse();

  expect(res.status).toEqual(302);
  expect(res.redirect).toEqual('http://op/session/end?id_token_hint=undefined');
});
