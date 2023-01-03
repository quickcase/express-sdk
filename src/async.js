/**
 * In Express v4, errors thrown in async functions within a middleware must be manually caught and passed to `next()`.
 * In Express v5, this will be done automatically. In the meantime, this decorator offers a behaviour similar to the one
 * of Express v5 where any decorated middleware returning a Promise will automatically call `next(error)` whenever the
 * promise is rejected.
 *
 * @param {function} middleware - Asynchronous middleware to wrap with async error handling
 * @return {function}
 */
export const asyncMiddleware = (middleware) => async (req, res, next) => {
  try {
    await middleware(req, res, next);
  } catch (e) {

    next(e);
  }
};