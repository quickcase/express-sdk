import {errors} from 'openid-client';
import {
  NoActiveAuthenticationError,
  OpenIdError,
  ProviderError,
  RelyingPartyError,
} from './errors';

const INDEX = '/';

/**
 * Express middleware processing OpenID callback requests using req.session.openId context.
 * Successful completion results in a redirection to either a saved redirect path or the index.
 */
export const callbackMiddleware = (deps) => (config) => async (req, res, next) => {
  const {
    callbackParamsSupplier,
    callbackHandler,
  } = deps;
  const {
    redirectUri,
  } = config;

  const params = callbackParamsSupplier(req);

  const authentication = req.session.openId?.authentication;

  if (!authentication || typeof authentication !== 'object') {
    return next(new NoActiveAuthenticationError('No active authentication found in session'));
  }

  if (!authentication.state) {
    return next(new NoActiveAuthenticationError('No state found in active authentication session'));
  }

  const checks = {
    response_type: 'code',
    state: authentication.state,
    nonce: authentication.nonce,
    max_age: authentication.maxAge,
  };

  try {
    const tokenSet = await callbackHandler(redirectUri, params, checks);

    req.session.openId = {
      ...req.session.openId,
      tokenSet,

      // Clear authentication
      authentication: undefined,
    };

    res.redirect(authentication.redirectTo ?? INDEX);
  } catch (e) {
    if (e instanceof errors.RPError) {
      return next(new RelyingPartyError(e));
    } else if (e instanceof errors.OPError) {
      return next(new ProviderError(e));
    } else {
      return next(new OpenIdError(undefined, e));
    }
  }
};
