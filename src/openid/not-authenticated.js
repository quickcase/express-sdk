/**
 * Rejects a non-authenticated request with a 401 response.
 * This is intended to be used for API requests.
 */
export const reject401 = (auth = {}) => (req, res) => {
  const params = [
    ...(auth.error ? [`error="${auth.error}"`, `error_description="${auth.errorDescription}"`] : []),
  ];
  return res.status(401)
            .set('WWW-Authenticate', `Bearer ${params.join(', ')}`)
            .end();
};

/**
 * Initiates a new authentication flow.
 * This is intended to be used for UI requests.
 */
export const startAuth302 = (deps) => (config) => (auth = {}) => (req, res) => {
  const {
    authorizationUrlSupplier,
    nonceGenerator,
    promptSupplier,
    stateGenerator,
  } = deps;
  const {
    disableNonce,
    loginHint,
    maxAge,
    prompt,
    scope,
  } = config;

  const nonce = disableNonce ? undefined : nonceGenerator();
  const state = stateGenerator();

  const authorizationUrl = authorizationUrlSupplier({
    login_hint: loginHint?.enable ? req.session.openId?.claims?.[loginHint.claim] : undefined,
    max_age: maxAge ?? undefined,
    nonce,
    prompt: promptSupplier(auth),
    scope,
    state,
  });

  // Save authentication context to session
  req.session.openId = {
    ...req.session.openId,
    authentication: {
      nonce,
      state,
      maxAge: maxAge ?? undefined,
      redirectTo: req.originalUrl,
    },
  };

  return res.redirect(authorizationUrl);
};
