export const ApiClient = (apiFactory) => (axiosInstance, options = {}) => (req, res) => {
  const {
    accessTokenProvider,
  } = options;

  /**
   * Create a new AbortController and tie it to the response `close` listener.
   *
   * `close` event may be triggered on `req` as soon as request body is read, eg. for multi-part content, hence it cannot
   * be used reliably to detect abrupt connection termination. Instead, we listen for `close` event on `res` which is more
   * reliable.
   */
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const decorateWithoutData = (axiosMethod) => async (url, config = {}) => axiosMethod(url, {
    ...config,
    signal: controller.signal,
    headers: {
      ...config.headers,
      ...(accessTokenProvider ? {'Authorization': 'Bearer ' + await accessTokenProvider(req)} : {}),
    },
  });

  const decorateWithData = (axiosMethod) => async (url, data, config = {}) => axiosMethod(url, data, {
    ...config,
    signal: controller.signal,
    headers: {
      ...config.headers,
      ...(accessTokenProvider ? {'Authorization': 'Bearer ' + await accessTokenProvider(req)} : {}),
    },
  });

  const decoratedAxiosInstance = {
    get: decorateWithoutData(axiosInstance.get),
    delete: decorateWithoutData(axiosInstance.delete),
    head: decorateWithoutData(axiosInstance.head),
    options: decorateWithoutData(axiosInstance.options),
    post: decorateWithData(axiosInstance.post),
    put: decorateWithData(axiosInstance.put),
    patch: decorateWithData(axiosInstance.patch),
    postForm: decorateWithData(axiosInstance.postForm),
    putForm: decorateWithData(axiosInstance.putForm),
    patchForm: decorateWithData(axiosInstance.patchForm),
  };

  return apiFactory(decoratedAxiosInstance);
}
