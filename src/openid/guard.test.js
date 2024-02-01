import {givenMiddleware} from '../test/index.js';
import {guard} from './guard.js';

describe('guard', () => {
  test('by default, should reject requests as not authenticated with 401 response', async () => {
    const req = {};
    const res = await givenMiddleware(guard()).when(req).expectResponse();

    expect(res.status).toBe(401);
  });

  test('by default, should call next when authenticated', async () => {
    const middleware = guard({
      authenticate: async () => ({authenticated: true}),
    });

    const req = {};
    await givenMiddleware(middleware).when(req).expectNext();
  });

  test('should be able to manipulate response', async () => {
    const middleware = guard({
      authenticate: async (req, res) => {
        res.cookie('new', 'cookie');
        return {
          authenticated: false,
        };
      },
    });

    const req = {};
    const res = await givenMiddleware(middleware).when(req).expectResponse();

    expect(res.cookies).toEqual([{name: 'new', value: 'cookie'}]);
  });
});
