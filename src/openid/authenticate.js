import {TokenSet} from 'openid-client';
import {Logger} from '../logging/index.js';

const ACCESS_TOKEN_HINT = 'access_token';
const logger = Logger('openid:authenticate');

/**
 * Introspect a token set to assess validity against expiry.
 * @param {object} deps - Dependencies
 * @returns {boolean} True if tokenSet is active, false otherwise
 */
export const defaultTokenSetIntrospector = (deps) => async (tokenSet) => {
  const {client} = deps;
  if (tokenSet.expires_at) {
    return !tokenSet.expired();
  } else {
    try {
      const introspection = await client.introspect(tokenSet.access_token, ACCESS_TOKEN_HINT);
      return introspection.active;
    } catch (error) {
      logger.warn('Error while introspecting access token because of:', error);
    }
  }

  return false;
};

export const ERROR = Object.freeze({
  NO_SESSION: 'no_session',
  NO_TOKEN: 'no_token',
  EXPIRED_TOKEN: 'expired_token',
  FAILED_REFRESH: 'failed_refresh',
});

/**
 * Authenticate a request based on the presence of a valid TokenSet in `req.session.openId`.
 */
export const authenticateFromSession = (deps) => async (req, res) => {
  const {
    tokenSetIntrospector,
    tokenSetRefresher,
  } = deps;

  const sessionTokenSet = req.session?.openId?.tokenSet;

  if (!sessionTokenSet || typeof sessionTokenSet !== 'object') {
    return {
      authenticated: false,
      error: ERROR.NO_SESSION,
      errorDescription: 'No session found',
    };
  }

  if (!sessionTokenSet.access_token) {
    return {
      authenticated: false,
      error: ERROR.NO_TOKEN,
      errorDescription: 'No access token in session',
    };
  }

  const tokenSet = new TokenSet(sessionTokenSet);

  const active = await tokenSetIntrospector(tokenSet);

  if (!active) {
    if (!tokenSet.refresh_token) {
      return {
        authenticated: false,
        error: ERROR.EXPIRED_TOKEN,
        errorDescription: 'Access token is expired',
      };
    }

    try {
      const refreshedTokenSet = await tokenSetRefresher(tokenSet);
      req.session.openId = {
        ...req.session.openId,
        tokenSet: {
          // Preserve id_token in case it's omitted from refresh response
          id_token: tokenSet.id_token,
          // Apply refreshed tokenSet
          ...refreshedTokenSet,
        },
      };
    } catch (error) {
      logger.warn('Error while attempting refresh request because of:', error);
      return {
        authenticated: false,
        error: ERROR.FAILED_REFRESH,
        errorDescription: 'The authorization server rejected the refresh request',
      };
    }
  }

  return {
    authenticated: true,
  };
};
