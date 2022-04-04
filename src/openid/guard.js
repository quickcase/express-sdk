const defaultDeps = () => ({
  authenticate: async (req, res, next) => ({authenticated: false}),
  onAuthenticated: (auth) => (req, res, next) => next(),
  onNotAuthenticated: (auth) => (req, res, next) => res.status(401).end(),
});

/**
 * Express middleware orchestrating authentication checks and side effects on incoming requests.
 */
export const guard = (deps = {}) => {
  const {
    authenticate,
    onAuthenticated,
    onNotAuthenticated,
  } = {...defaultDeps(), ...deps};

  return async (req, res, next) => {
    const auth = await authenticate(req, res);

    if (auth.authenticated) {
      return onAuthenticated(auth)(req, res, next);
    }

    return onNotAuthenticated(auth)(req, res, next);
  };
};
