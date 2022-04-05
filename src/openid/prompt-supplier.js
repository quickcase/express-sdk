import {ERROR} from './authenticate';

/**
 * Decides which OpenID `prompt` value should be used based on configuration
 * and last authentication error. Defaults to `undefined`.
 */
export const defaultPromptSupplier = (config = {}) => (auth) => {
  switch (auth.error) {
    case ERROR.EXPIRED_TOKEN:
      return config.expired ?? undefined;
    default:
      return config.default ?? undefined;
  }
};
