export const createHttpDependencyCheck = ({
                                            name,
                                            url,
                                            timeoutMs = 1000
                                          }) => {
  return {
    name,
    check: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {'Accept': 'application/json'}
        });

        clearTimeout(timeout);

        return {
          status: response.ok ? 'UP' : 'DOWN',
          details: {
            url,
            statusCode: response.status,
          }
        };
      } catch (err) {
        clearTimeout(timeout);

        return {
          status: 'DOWN',
          details: {
            url,
            error: err.message
          }
        };
      }
    }
  };
};
