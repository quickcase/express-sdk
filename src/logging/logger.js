import {inspect} from 'util';
import {createLogger, format, transports} from 'winston';

const {errors, json, metadata, prettyPrint, printf, splat, timestamp} = format;

const DEFAULT_LOG_FORMAT = 'json';
const DEFAULT_LOG_LEVEL = 'info';
const NPM_LOG_LEVEL_MAP = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  http: 'http',
  debug: 'debug',
  trace: 'verbose'
}

const customMessageFormat = format((info) => {
  const {message: infoMsg, metadata, stack, ...otherInfo} = info;
  let message = infoMsg;
  if (metadata && typeof metadata === 'object' && Object.keys(metadata).length) {
    message = message + inspect(metadata);
  }

  return {
    message,
    exception: stack,
    ...otherInfo
  };
});

const logLevel = () => {
  const level = NPM_LOG_LEVEL_MAP[(process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL).toLowerCase()];
  return level || DEFAULT_LOG_LEVEL;
};

const logFormat = () => {
  const logFormat = (process.env.LOG_FORMAT || DEFAULT_LOG_FORMAT).toLowerCase();

  switch (logFormat) {
    case 'prettyprint':
      return prettyPrint();
    case 'printf':
      return printf(({timestamp, level, message, logger_name, exception}) => {
        return `${timestamp} [${level}] : [${logger_name}] ${message} ${exception ? '\n' + exception : ''}`;
      });
    default:
      return json();
  }
};

/**
 * This logger outputs the logs in json format with fields
 *   level: log level,
 *   timestamp: timestamp the message was received,
 *   logger_name: name of the module/file logging the message,
 *   message: logger statement with dynamic data,
 *   exception: error stack trace if any
 * e.g.
 * {
 *   "level": "info",
 *   "timestamp": "2021-01-14T11:40:54.859Z",
 *   "message": "Hello World { hello: 'world' }",
 *   "logger_name": "loggerTest",
 *   "exception": "Error: ...."
 * }
 */
const logger = createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    verbose: 5
  },
  level: logLevel(),
  format: format.combine(
    timestamp(),
    splat(),
    metadata({fillExcept: ['level', 'timestamp', 'message', 'logger_name', 'response_code', 'stack']}),
    errors({stack: true}),
    customMessageFormat(),
    logFormat()
  ),
  transports: [
    new transports.Console({
      level: process.env.LOG_LEVEL || 'info'
    })],
  exitOnError: false
});

export const Logger = (logger_name) => logger.child({logger_name});
