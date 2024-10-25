import {Logger} from './logger.js';

const defaultLevelSupplier = (req, res, interrupted = false) => {
  if (interrupted) {
    return 'warn';
  } else if (res.statusCode < 400 || res.statusCode === 404) {
    return 'info';
  } else if (res.statusCode >= 500) {
    return 'error';
  } else {
    return 'warn';
  }
};

/**
 *
 * @param {Object.<string, array[number]>} mutePaths - Object with exact paths to match as keys and array of status codes
 *  to match as values, eg:
 *  ```
 *  {
 *    '/health': [200],
 *  }
 *  ```
 * @returns {(function(*, *, boolean=): (string))|*} level supplier function
 */
const mutePathsLevelSupplier = (mutePaths = {}) => (req, res, interrupted = false) => {
  // Mute access logs for matching requests
  if (mutePaths[req.path] && mutePaths[req.path].includes(res.statusCode)) {
    return 'debug';
  }

  if (interrupted) {
    return 'warn';
  } else if (res.statusCode < 400 || res.statusCode === 404) {
    return 'info';
  } else if (res.statusCode >= 500) {
    return 'error';
  } else {
    return 'warn';
  }
};

export const AccessLoggerLevelSuppliers = Object.freeze({
  DEFAULT: defaultLevelSupplier,
  MUTE_PATHS: mutePathsLevelSupplier,
});

const defaultFormatter = (req, res, interrupted = false) => [
  interrupted ? 'INTERRUPTED ' : '',
  '"',
  req.method + ' ' + (req.originalUrl || req.url),
  ' HTTP/' + req.httpVersionMajor + '.' + req.httpVersionMinor,
  '" ',
  res.statusCode,
].join('');

const DEFAULT_CONFIG = Object.freeze({
  logger: Logger('express.access'),
  formatter: defaultFormatter,
  levelSupplier: defaultLevelSupplier,
});

export const AccessLogger = (config = {}) => {
  const {logger, formatter, levelSupplier} = {...DEFAULT_CONFIG, ...config};

  const log = (req, res, interrupted = false) => {
    const level = levelSupplier(req, res, interrupted);
    logger.log({
      level,
      response_code: interrupted ? 499 : res.statusCode,
      message: formatter(req, res, interrupted),
    });
  };

  return (req, res, next) => {
    const closeListener = () => log(req, res, true);

    res.on('finish', () => {
      log(req, res);

      // Access already logged, no need to log on close
      res.removeListener('close', closeListener);
    });

    res.on('close', closeListener);

    next();
  };
};
