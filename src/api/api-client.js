import axios from 'axios';

export const ApiClient = (apiFactory) => (options) => (req, res) => {
  const {
    accessTokenProvider,
    baseURL,
  } = options;
  const axiosInstance = axios.create({
    baseURL,
  });

  /*
    `close` event may be triggered on `req` as soon as request body is read, eg. for multi-part content, hence it cannot
    be used reliably to detect abrupt connection termination. Instead we listen for `close` event on `res` which is more
    reliable.
   */
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  axiosInstance.interceptors.request.use(async (config) => {
    return {
      ...config,
      signal: controller.signal,
      headers: {
        ...config.headers,
        ...(accessTokenProvider ? {'Authorization': 'Bearer ' + await accessTokenProvider(req)} : {}),
      },
    };
  });

  return apiFactory(axiosInstance, req);
}
