import {createHttpDependencyCheck} from './http-check.js';
import nock from 'nock';

describe('createHttpDependencyCheck', () => {
  const url = 'http://api.test';
  const path = '/health';
  const fullUrl = `${url}${path}`;

  afterEach(() => {
    nock.cleanAll();
  });

  test('should return UP for a 200 response', async () => {
    nock(url)
      .get(path)
      .reply(200);

    const dependency = createHttpDependencyCheck({
      name: 'api',
      url: fullUrl
    });

    const result = await dependency.check();

    expect(result.status).toBe('UP');
    expect(result.details.statusCode).toBe(200);
  });

  test('should return DOWN for a 500 response', async () => {
    nock(url)
      .get(path)
      .reply(500);

    const dependency = createHttpDependencyCheck({
      name: 'api',
      url: fullUrl
    });

    const result = await dependency.check();

    expect(result.status).toBe('DOWN');
    expect(result.details.statusCode).toBe(500);
  });

  test('should return DOWN and timeout message on timeout', async () => {
    nock(url)
      .get(path)
      .delay(1000)
      .reply(200);

    const dependency = createHttpDependencyCheck({
      name: 'api',
      url: fullUrl,
      timeoutMs: 500,
    });

    const result = await dependency.check();

    expect(result.status).toBe('DOWN');
    expect(result.details.error).toContain('This operation was aborted');
  });
});
