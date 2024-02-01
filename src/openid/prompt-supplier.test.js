import {ERROR} from './authenticate.js';
import {defaultPromptSupplier} from './prompt-supplier.js';

describe('defaultPromptSupplier', () => {
  test('should return undefined when no prompt set', async () => {
    const config = undefined;
    const prompt = defaultPromptSupplier(config)({});

    expect(prompt).toBe(undefined);
  });

  test('should return default prompt', async () => {
    const config = {
      default: 'login consent',
      expired: 'none',
    };
    const prompt = defaultPromptSupplier(config)({});

    expect(prompt).toBe('login consent');
  });

  describe('when auth error is `expired_token`', () => {
    test('should return undefined when not set', async () => {
      const config = {
        default: 'login consent',
      };
      const prompt = defaultPromptSupplier(config)({error: ERROR.EXPIRED_TOKEN});

      expect(prompt).toBe(undefined);
    });

    test('should return expired prompt when set', async () => {
      const config = {
        default: 'login consent',
        expired: 'none',
      };
      const prompt = defaultPromptSupplier(config)({error: ERROR.EXPIRED_TOKEN});

      expect(prompt).toBe('none');
    });
  });
});
