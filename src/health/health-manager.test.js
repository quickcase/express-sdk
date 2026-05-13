import {HealthManager} from './health-manager.js';

describe('HealthManager', () => {

  test('should return UP when all checks pass', async () => {
    const manager = new HealthManager([{
      name: 'test-check',
      check: async () => ({status: 'UP'}),
    }]);

    const report = await manager.runChecks();

    expect(report.status).toBe('UP');
    expect(report.components['test-check'].status).toBe('UP');
  });

  test('should return DOWN if a check fails', async () => {

    const manager = new HealthManager([{
      name: 'failing-check',
      check: async () => ({status: 'DOWN'}),
    }]);

    const report = await manager.runChecks();

    expect(report.status).toBe('DOWN');
    expect(report.components['failing-check'].status).toBe('DOWN');
  });

  test('should return DOWN if a check throws an error', async () => {
    const manager = new HealthManager([{
      name: 'error-check',
      check: async () => {
        throw new Error('Network Failure');
      }
    }]);

    const report = await manager.runChecks();

    expect(report.status).toBe('DOWN');

    expect(report.components['error-check'].details.error).toBe('Network Failure');
  });

  test('should return UP when no dependencies are configured', async () => {
    const manager = new HealthManager();

    const report = await manager.runChecks();

    expect(report.status).toBe('UP');
  });

  test('should return HTTP 200 for healthy dependencies', async () => {
    const manager = new HealthManager([{
      name: 'app1',
      check: async () => ({status: 'UP'})
    }]);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await manager.get(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'UP',
      components: {
        'app1': {
          status: 'UP'
        }
      }
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return HTTP 503 for unhealthy dependencies', async () => {
    const manager = new HealthManager([{
      name: 'app1',
      check: async () => ({status: 'DOWN'})
    }]);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await manager.get(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      status: 'DOWN',
      components: {
        'app1': {
          status: 'DOWN'
        }
      }
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next when get health throws an error', async () => {
    const manager = new HealthManager();

    jest.spyOn(manager, 'runChecks').mockRejectedValue(new Error('Unexpected failure'));

    const req = {};
    const res = {
      status: jest.fn(),
      json: jest.fn()
    };
    const next = jest.fn();

    await manager.get(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Unexpected failure');
  });

});
