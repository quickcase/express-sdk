import {givenMiddleware} from '../test';
import {logoutMiddleware} from './logout';

const config = {};

const deps = {
  endSessionUrlSupplier: ({id_token_hint}) => `http://op/session/end?id_token_hint=${id_token_hint}`,
};

test('should destroy session', async () => {
  const middleware = logoutMiddleware(deps)(config);

  const req = {
    session: {
      destroy: jest.fn((cb) => cb()),
    }
  };

  await givenMiddleware(middleware).when(req).expectResponse();

  expect(req.session.destroy).toHaveBeenCalledTimes(1);
});

test('should redirect to end session URL', async () => {
  const middleware = logoutMiddleware(deps)(config);

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

test('should silently handle session destruction error', async () => {
  const middleware = logoutMiddleware(deps)(config);

  const req = {
    session: {
      id: '123',
      destroy: jest.fn((cb) => cb(new Error('Session could not be destroyed'))),
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
