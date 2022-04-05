
const ERROR = Object.freeze({
  NO_ACTIVE_AUTH: 'no_active_authentication',
  RP_ERROR: 'relying_party_error',
  UNKNOWN: 'unknown_error',
});

/**
 * A generic OpenId error. This is not intended to be used directly, instead an error-specific
 * child class should be used.
 */
export class OpenIdError extends Error {
  constructor(code = ERROR.UNKNOWN, {name, message, stack, ...rest} = {}) {
    super(message ?? code);

    Object.assign(this, rest);

    this.code = code;
    this.name = name ?? this.constructor.name;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error raised when a callback is received in a context where no ongoing
 * authentication flow is present (eg. no session or state) and thus checks such
 * as state cannot be performed.
 */
export class NoActiveAuthenticationError extends OpenIdError {
  constructor(message) {
    super(ERROR.NO_ACTIVE_AUTH, {
      message,
    });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class thrown when client-side response expectations/validations fail to pass.
 * Used to encapsulate [openid-client's RPError]{@link https://github.com/panva/node-openid-client/blob/main/docs/README.md#class-rperror}
 */
export class RelyingPartyError extends OpenIdError {
  constructor(rpError) {
    super(ERROR.RP_ERROR, rpError);
  }
}

/**
 * Error class thrown when a regular OAuth 2.0 / OIDC style error is returned by the AS or an unexpected response is sent by the OP.
 * Used to encapsulate [openid-client's OPError]{@link https://github.com/panva/node-openid-client/blob/main/docs/README.md#class-operror}
 */
export class ProviderError extends OpenIdError {
  constructor(opError) {
    super(opError.error, opError);
  }
}
