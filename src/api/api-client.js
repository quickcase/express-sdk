import axios from 'axios';

export const ApiClient = (apiFactory) => (options) => (req) => {
  const {
    accessTokenProvider,
    baseURL,
  } = options;
  const axiosInstance = axios.create({
    baseURL,
  });
  const controller = new AbortController();
  req.on('close', () => controller.abort());

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