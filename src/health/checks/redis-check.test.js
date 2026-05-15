import {createRedisDependencyCheck} from './redis-check.js';

describe('createRedisDependencyCheck', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      isReady: true,
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG'),
      constructor: {name: 'RedisClient'}
    };
  });

  test('should return UP when client isReady and ping succeeds', async () => {
    const redisDependency = createRedisDependencyCheck({
      client: mockClient,
    });

    const result = await redisDependency.check();

    expect(result.status).toBe('UP');
    expect(mockClient.ping).toHaveBeenCalled();
  });

  test('should return redis client type when mode is provided', async () => {
    const redisDependency = createRedisDependencyCheck({
      client: mockClient,
      mode: 'standalone',
    });

    const result = await redisDependency.check();

    expect(result.status).toBe('UP');
    expect(result.details.type).toBe('standalone');
    expect(mockClient.ping).toHaveBeenCalled();
  });

  test('should not have redis client type when mode is not provided', async () => {
    const redisDependency = createRedisDependencyCheck({
      client: mockClient,
    });

    const result = await redisDependency.check();

    expect(result.status).toBe('UP');
    expect(result.details?.type).toBeUndefined();
    expect(mockClient.ping).toHaveBeenCalled();
  });

  test('should return DOWN if ping fails', async () => {
    mockClient.ping.mockRejectedValue(new Error('Connection Lost'));

    const redisDependency = createRedisDependencyCheck({
      client: mockClient
    });
    const result = await redisDependency.check();

    expect(result.status).toBe('DOWN');
    expect(result.details.error).toBe('Connection Lost');
  });

  test('should handle Cluster naming correctly', async () => {
    mockClient.constructor.name = 'RedisCluster';

    const redisDependency = createRedisDependencyCheck({
      client: mockClient,
      mode: 'cluster',
    });

    const result = await redisDependency.check();

    expect(result.details.type).toBe('cluster');
  });

  test('should return DOWN on timeout', async () => {
    mockClient.ping.mockReturnValue(new Promise(() => {}));

    const redisDependency = createRedisDependencyCheck({
      client: mockClient,
      timeoutMs: 100
    });

    const result = await redisDependency.check();

    expect(result.status).toBe('DOWN');
    expect(result.details.error).toContain('health check timed out');
  });
});
