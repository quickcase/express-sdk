import {Logger} from '../logging/index.js';

const logger = Logger('openid:logout');

/**
 * Express middleware handling destruction of session and optionally OpenID RP-initiated logout.
 *
 * By default, an RP-initiated logout will only be initiated if an ID token is present in the session. If so, this will
 * terminate the middleware chain by returning a redirect response to the user agent. This behaviour can be forced using
 * option `forceRpInitiatedLogout`.
 *
 * Otherwise, the next middleware in the chain will be called and should be used to display a logout confirmation.
 */
export const logoutMiddleware = (deps) => (options = {}) => async (req, res, next) => {
  const {
    endSessionUrlSupplier,
  } = deps;
  const {
    forceRpInitiatedLogout = false
  } = options;

  const idToken = req.session?.openId?.tokenSet?.id_token;

  req.session.destroy((err) => {
    if (err) {
      logger.warn(`Error while destroying session ${req.session?.id}:`, err);
    }

    // Initiate RP-initiated logout when either forced or ID token available
    if (endSessionUrlSupplier && (idToken || forceRpInitiatedLogout)) {
      const endSessionUrl = endSessionUrlSupplier({
        id_token_hint: idToken,
      });
      return res.redirect(endSessionUrl);
    }

    return next();
  });
};
