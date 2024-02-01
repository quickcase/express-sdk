import {Logger} from '../logging/index.js';

const logger = Logger('openid:logout');

/**
 * Express middleware handling destruction of session and OpenID RP-initiated logout.
 */
export const logoutMiddleware = (deps) => (config) => async (req, res) => {
  const {
    endSessionUrlSupplier,
  } = deps;
  // const {} = config;

  const endSessionUrl = endSessionUrlSupplier({
    id_token_hint: req.session?.openId?.tokenSet?.id_token,
  });

  req.session.destroy((err) => {
    if (err) {
      logger.warn(`Error while destroying session ${req.session.id}:`, err);
    }

    return res.redirect(endSessionUrl);
  });
};
