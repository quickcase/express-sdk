export class HealthManager {
  constructor(dependencies = []) {
    this.dependencies = dependencies;
    this.get = this.get.bind(this);
  }

  async runChecks() {
    if (this.dependencies.length === 0) {
      return {
        status: 'UP'
      };
    }

    const results = await Promise.all(
      this.dependencies.map(async (dependency) => {
        try {
          const result = await dependency.check();
          return {name: dependency.name, result};
        } catch (err) {
          return {
            name: dependency.name,
            result: {status: 'DOWN', details: {error: err.message}}
          };
        }
      })
    );

    const components = {};
    let overallStatus = 'UP';

    for (const {name, result} of results) {
      components[name] = result;
      if (result.status !== 'UP') {
        overallStatus = 'DOWN';
      }
    }

    return {status: overallStatus, components};
  }

  async get(req, res, next) {
    try {
      const result = await this.runChecks();

      return res.status(
        result.status === 'UP'
          ? 200
          : 503,
      ).json(result);
    } catch (e) {
      next(e);
    }
  }
}
