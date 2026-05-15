export const createRedisDependencyCheck = ({
                                             name = 'redis',
                                             mode,
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
          ...(mode ? {details: {type: mode}} : {})
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
