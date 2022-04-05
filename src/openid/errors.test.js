import {errors} from 'openid-client';
import {OpenIdError} from './errors';

describe('OpenIdError', () => {
  test('should construct new error', () => {
    const error = new OpenIdError('some_reason', {
      message: 'Reason for the error',
    });

    expect(error.code).toEqual('some_reason');
    expect(error.message).toEqual('Reason for the error');
    expect(error.name).toEqual('OpenIdError');
    expect(error.stack).toMatch('OpenIdError: Reason for the error');
  });

  test('should default code to unknown', () => {
    const error = new OpenIdError();

    expect(error.code).toEqual('unknown_error');
  });

  test('should default message to code', () => {
    const error = new OpenIdError('some_reason');

    expect(error.message).toEqual('some_reason');
  });

  test('should decorate RPError', () => {
    const rpError = new errors.RPError({
      message: 'some RP error',
      checks: {
        nonce: 'nonce error',
      },
    });
    const error = new OpenIdError('some_reason', rpError);

    expect(error.message).toEqual('some RP error');
    expect(error.name).toEqual('RPError');
    expect(error.stack).toMatch('RPError: some RP error');
    expect(error).toMatchObject({
      checks: {
        nonce: 'nonce error',
      },
    });
  });

  test('should decorate OPError', () => {
    const opError = new errors.OPError({
      error_description: 'description',
      error: 'OP error',
      error_uri: 'http://error/uri',
      session_state: 'some-session-state',
      state: 'some-state',
      scope: 'scope1 scope2',
    });
    const error = new OpenIdError('some_reason', opError);

    expect(error.message).toEqual('OP error (description)');
    expect(error.name).toEqual('OPError');
    expect(error.stack).toMatch('OPError: OP error (description)');
    expect(error).toMatchObject({
      error_description: 'description',
      error: 'OP error',
      error_uri: 'http://error/uri',
      session_state: 'some-session-state',
      state: 'some-state',
      scope: 'scope1 scope2',
    });
  });
});
