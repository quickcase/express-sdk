import * as cookie from 'cookie';
import Debug from 'debug';
import onHeaders from 'on-headers';

const debug = Debug('express-sdk:session:track-expiry');

const HEADER_SET_COOKIE = 'Set-Cookie';
const DEFAULT_SESSION_COOKIE_NAME = 'connect.sid';

/**
 * Middleware for intercepting express-session's session cookie updates and expose the session cookie expiry as the value
 * of a dedicated tracker cookie.
 *
 * This middleware must be registered BEFORE the express-session middleware to ensure it's `onHeaders` listener is
 * triggered AFTER express-session's one and can correctly detect session cookie updates.
 *
 * By default, the tracker cookie is named after express-session's own cookie name suffixed with `_expiry`. A custom name
 * can be provided using option `trackerName`.
 *
 * @param {Object} options
 * @param {string?} options.sessionName - Name of express-session's cookie, defaults to `connect.sid`
 * @param {string?} options.trackerName - Name of tracker cookie, defaults to session cookie name suffixed with `_expiry`
 * @return ExpressJS middleware
 */
export const trackCookieExpiry = (options = {}) => (req, res, next) => {
  const sessionName = options.sessionName || DEFAULT_SESSION_COOKIE_NAME;
  const trackerName = options.trackerName || sessionName + '_expiry';

  onHeaders(res, () => {
    if (req.session?.cookie?.expires && isCookieSet(sessionName)(res)) {
      const trackerCookie = cookie.serialize(trackerName, req.session.cookie.expires.toISOString(), {
        ...req.session.cookie.data,
        httpOnly: false,
      });

      debug('set-cookie %s', trackerCookie);

      const prevCookie = res.getHeader(HEADER_SET_COOKIE);
      const updatedCookie = Array.isArray(prevCookie) ? prevCookie.concat(trackerCookie) : [prevCookie, trackerCookie];

      res.setHeader('Set-Cookie', updatedCookie);
    }
  });

  return next();
};

const isCookieSet = (cookieName) => (res) => {
  const cookies = res.getHeader(HEADER_SET_COOKIE);

  if (!cookies) {
    return false;
  }

  const predicate = (cookie) => cookie.startsWith(cookieName + '=');

  if (typeof cookies === 'string') {
    return predicate(cookies);
  }

  if (Array.isArray(cookies)) {
    return !!cookies.find(predicate);
  }

  debug('invalid cookie format: %s', cookies);

  return false;
};
