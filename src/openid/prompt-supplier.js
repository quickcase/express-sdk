import {ERROR} from './authenticate.js';

/**
 * Decides which OpenID `prompt` value should be used based on configuration
 * and last authentication error. Defaults to `undefined`.
 */
export const defaultPromptSupplier = (config = {}) => (auth) => {
  switch (auth.error) {
    case ERROR.EXPIRED_TOKEN:
    case ERROR.FAILED_REFRESH:
      return config.expired ?? undefined;
    default:
      return config.default ?? undefined;
  }
};
