import {asyncMiddleware} from './async';
import {givenMiddleware} from './test';

test('should call next with thrown async error', async () => {
  const middleware = (req, res) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('error');
      }, 1);
    })
  };

  const safeMiddleware = asyncMiddleware(middleware);

  const next = await givenMiddleware(safeMiddleware).when({}).expectNext();

  expect(next).toBe('error');
});

test('should not call next when no error', async () => {
  const middleware = async (req, res) => {
    await new Promise((resolve, reject) => {
      resolve();
    });
    res.end();
  };

  const safeMiddleware = asyncMiddleware(middleware);

  const res = await givenMiddleware(safeMiddleware).when({}).expectResponse();

  expect(res.status).toBe(200);
});