const isTrueObject = (variable) => typeof variable === 'object' && !Array.isArray(variable) && variable !== null;

/**
 * Asynchronous function encapsulating the execution of an Express middleware for test purpose.
 * @param {function} middleware Express middleware function taking 3 parameters: req, res, next
 * @param {object} req Express request object
 * @param {boolean} expectResponse Whether a response is expected (true) or a call to `next` (false)
 * @return Promise resolved or rejected depending on whether a response or next was expected
 */
const expectMiddleware = (middleware, req, expectResponse) => new Promise((resolve, reject) => {
  const resolveResponse = expectResponse ? resolve : reject;
  const next = expectResponse ? (error) => {
    if (error.message) {
      error.message = `Unexpected call to next() with error: ` + error.message;
    } else {
      error = `Unexpected call to next() with error: ` + JSON.stringify(error);
    }
    reject(error);
  } : resolve;

  let response = {status: 200, headers: {}};

  const res = {};
  res.cookie = (name, value, options) => (response.cookies = [...(response.cookies || []), {name, value, options}], res);
  res.clearCookie = (name, options) => (response.clearCookies = [...(response.clearCookies || []), {name, options}], res);
  res.status = (code) => (response.status = code, res);
  res.set = (field, value) => (response.headers = {...response.headers, ...(isTrueObject(field) ? field : {[field]: value})}, res);
  res.header = res.set;
  res.json = (body) => (response.body = body, resolveResponse(response));
  res.redirect = (statusOrPath, path) => (Object.assign(response, path ? {status: statusOrPath, redirect: path} : {status: 302, redirect: statusOrPath}), resolveResponse(response));
  res.render = (view, locals) => (Object.assign(response, {render: {view, locals}}), resolveResponse(response));
  res.send = res.json;
  res.end = () => resolveResponse(response);

  middleware(req, res, next);
});

/**
 * Syntactic sugar over {@link expectMiddleware} to provide arguments in a
 * given/when/expect fashion.
 * @param {function} middleware Express middleware function acception 3 parameters: req, res, next
 * @return {object} Object with `when` property containing function {@link whenMiddleware}
 */
export const givenMiddleware = (middleware) => ({when: whenMiddleware(middleware)});

/**
 * Syntactic sugar over {@link expectMiddleware} to provide arguments in a
 * when/expect fashion.
 * @param {function} middleware Express middleware function acception 3 parameters: req, res, next
 * @param {object} req Express request object
 * @return {object} Object with `expectResponse` and `expectNext` functions, both executing {@link expectMiddleware}
 */
const whenMiddleware = (middleware) => (req) => ({
  expectResponse: () => expectMiddleware(middleware, req, true),
  expectNext: () => expectMiddleware(middleware, req, false),
});
