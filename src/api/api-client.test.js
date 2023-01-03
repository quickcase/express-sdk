import nock from 'nock';
import {ApiClient} from './api-client';

export const MockRequest = () => {
  const listeners = [];

  return {
    on: (event, listener) => listeners.push({on: event, call: listener}),
    trigger: (event) => listeners.filter((listener) => event === listener.on)
                                 .forEach((listener) => listener.call()),
  };
};

const TestApiClient = ApiClient((axiosInstance) => ({
  listSamples: () => axiosInstance.get(`/samples`, {
    headers: {
      'accept': 'application/samples+json;charset=UTF-8',
    },
  }),
}));

test('should make API calls as configured', async () => {
  const req = MockRequest();
  const client = TestApiClient({baseURL: 'https://api.quickcase.app'})(req);

  const scope = nock('https://api.quickcase.app', {
      reqheaders: {
        'accept': 'application/samples+json;charset=UTF-8',
      },
    })
    .get('/samples')
    .reply(200, {
      samples: [
        {id: 1},
        {id: 2},
      ],
    });

  const res = await client.listSamples();

  expect(res.status).toBe(200);
  expect(res.data).toEqual({
    samples: [
      {id: 1},
      {id: 2},
    ],
  });

  scope.done();
});

test('should authorize API call with provided access token', async () => {
  const req = MockRequest();
  const client = TestApiClient({
    accessTokenProvider: () => Promise.resolve('token-123'),
    baseURL: 'https://api.quickcase.app',
  })(req);

  const scope = nock('https://api.quickcase.app', {
      reqheaders: {
        'accept': 'application/samples+json;charset=UTF-8',
        'Authorization': 'Bearer token-123',
      },
    })
    .get('/samples')
    .reply(200, {
      samples: [
        {id: 1},
        {id: 2},
      ],
    });

  const res = await client.listSamples();

  expect(res.status).toBe(200);
  expect(res.data).toEqual({
    samples: [
      {id: 1},
      {id: 2},
    ],
  });

  scope.done();
});

test('should abort API call when request aborted', async () => {
  const req = MockRequest();
  const client = TestApiClient({
    baseURL: 'https://api.quickcase.app',
  })(req);

  nock('https://api.quickcase.app', {
      reqheaders: {
        'accept': 'application/samples+json;charset=UTF-8',
      },
    })
    .get('/samples')
    .delay(2000)
    .reply(200, {
      samples: [
        {id: 1},
        {id: 2},
      ],
    });

  const promise = client.listSamples();

  req.trigger('close');

  await expect(promise).rejects.toEqual({
    message: 'canceled',
  });
});
