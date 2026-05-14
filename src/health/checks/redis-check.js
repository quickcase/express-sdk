export const createRedisDependencyCheck = ({
                                             name = 'redis',
                                             client,
                                             timeoutMs = 1000
                                           }) => {

  const timeoutPromise = () =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${name} health check timed out`));
      }, timeoutMs);
    });

  return {
    name,
    check: async () => {
      try {
        await Promise.race([
          client.ping(),
          timeoutPromise()
        ]);

        return {
          status: 'UP',
          details: {
            type: client.constructor.name.includes('Cluster')
              ? 'cluster'
              : 'standalone'
          }
        };
      } catch (err) {
        return {
          status: 'DOWN',
          details: {
            error: err.message
          }
        };
      }
    }
  };
};
