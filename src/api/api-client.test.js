import {jest} from '@jest/globals';
import axios, {CanceledError} from 'axios';
import nock from 'nock';
import {ApiClient} from './api-client.js';

export const MockRequest = () => {
  const listeners = [];

  return {
    on: (event, listener) => listeners.push({on: event, call: listener}),
    trigger: (event) => listeners.filter((listener) => event === listener.on)
                                 .forEach((listener) => listener.call()),
  };
};

export const MockResponse = () => {
  const listeners = [];

  return {
    on: (event, listener) => listeners.push({on: event, call: listener}),
    trigger: (event) => listeners.filter((listener) => event === listener.on)
                                 .forEach((listener) => listener.call()),
  };
};

const TestApiClient = ApiClient((axiosInstance) => ({
  listSamples: () => axiosInstance.get('/samples', {
    headers: {
      'accept': 'application/samples+json;charset=UTF-8',
    },
  }),
  listNoConfig: () => axiosInstance.get('/samples'),
  createSample: (sample) => axiosInstance.post('/samples', sample, {
    headers: {
      'accept': 'application/samples+json;charset=UTF-8',
    }
  }),
  createNoConfig: (sample) => axiosInstance.post('/samples', sample),
}));

test('should make GET API calls as configured', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance)(req, res);

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

  const listResponse = await client.listSamples();

  expect(listResponse.status).toBe(200);
  expect(listResponse.data).toEqual({
    samples: [
      {id: 1},
      {id: 2},
    ],
  });

  scope.done();
});

test('should make GET API calls without config', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance)(req, res);

  const scope = nock('https://api.quickcase.app')
    .get('/samples')
    .reply(200, {
      samples: [
        {id: 1},
        {id: 2},
      ],
    });

  const listResponse = await client.listNoConfig();

  expect(listResponse.status).toBe(200);
  expect(listResponse.data).toEqual({
    samples: [
      {id: 1},
      {id: 2},
    ],
  });

  scope.done();
});

test('should authorize GET API call with provided access token', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance, {
    accessTokenProvider: () => Promise.resolve('token-123'),
  })(req, res);

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

  const listResponse = await client.listSamples();

  expect(listResponse.status).toBe(200);
  expect(listResponse.data).toEqual({
    samples: [
      {id: 1},
      {id: 2},
    ],
  });

  scope.done();
});

test('should make POST API calls as configured', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance)(req, res);

  const sample = {name: 'Some sample'};

  const scope = nock('https://api.quickcase.app', {
    reqheaders: {
      'accept': 'application/samples+json;charset=UTF-8',
    },
  })
    .post('/samples', sample)
    .reply(201, {
      id: '1',
      ...sample,
    });

  const createResponse = await client.createSample(sample);

  expect(createResponse.status).toBe(201);
  expect(createResponse.data).toEqual({
    id: '1',
    name: 'Some sample',
  });

  scope.done();
});

test('should make POST API calls without config', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance)(req, res);

  const sample = {name: 'Some sample'};

  const scope = nock('https://api.quickcase.app')
    .post('/samples', sample)
    .reply(201, {
      id: '1',
      ...sample,
    });

  const createResponse = await client.createNoConfig(sample);

  expect(createResponse.status).toBe(201);
  expect(createResponse.data).toEqual({
    id: '1',
    name: 'Some sample',
  });

  scope.done();
});

test('should authorize POST API call with provided access token', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const axiosInstance = axios.create({
    baseURL: 'https://api.quickcase.app',
  });
  const client = TestApiClient(axiosInstance, {
    accessTokenProvider: () => Promise.resolve('token-123'),
  })(req, res);

  const sample = {name: 'Some sample'};

  const scope = nock('https://api.quickcase.app', {
    reqheaders: {
      'accept': 'application/samples+json;charset=UTF-8',
      'Authorization': 'Bearer token-123',
    },
  })
    .post('/samples', sample)
    .reply(201, {
      id: '1',
      ...sample,
    });

  const createResponse = await client.createSample(sample);

  expect(createResponse.status).toBe(201);
  expect(createResponse.data).toEqual({
    id: '1',
    name: 'Some sample',
  });

  scope.done();
});

test('should abort API call when request aborted', async () => {
  const req = MockRequest();
  const res = MockResponse();

  const canceledError = new CanceledError();

  const axiosInstance = {
    get: jest.fn().mockRejectedValue(canceledError)
  };
  const client = TestApiClient(axiosInstance)(req, res);

  const promise = client.listSamples();

  res.trigger('close');

  await expect(promise).rejects.toBe(canceledError);

  const requestConfig = axiosInstance.get.mock.calls[0][1];

  expect(requestConfig.signal.aborted).toBe(true);
});
