import {trackCookieExpiry} from './track-expiry.js';

test('should not set tracker cookie when no cookie in session', () => {
  const req = {
    session: {
      cookie: undefined // <-- No cookie
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry()(req, res, next);

  // Mock header written by express-session
  res.getHeader.mockReturnValue('connect.sid=xxx');

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
});

test('should not set tracker cookie when no session cookie being written', () => {
  const req = {
    session: {
      cookie: {
        expires: new Date(),
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry()(req, res, next);

  // No `Set-Cookie` header set by express-session
  res.getHeader.mockReturnValue(undefined);

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
});

test('should not set cookie when invalid Set-Cookie header set', () => {
  const req = {
    session: {
      cookie: {
        expires: new Date(),
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry()(req, res, next);

  // No `Set-Cookie` header set by express-session
  res.getHeader.mockReturnValue({x: 'y'}); // <-- Not valid

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
});

test('should set tracker cookie when session cookie being written', () => {
  const date = new Date('2025-04-07T12:34:56Z');
  const req = {
    session: {
      cookie: {
        expires: date,
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry()(req, res, next);

  // Mock header written by express-session
  res.getHeader.mockReturnValue('connect.sid=xxx');

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
    'connect.sid=xxx',
    'connect.sid_expiry=2025-04-07T12%3A34%3A56.000Z',
  ]);
});

test('should support arrays of cookies being written', () => {
  const date = new Date('2025-04-07T12:34:56Z');
  const req = {
    session: {
      cookie: {
        expires: date,
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry()(req, res, next);

  // Mock header written by express-session
  res.getHeader.mockReturnValue([
    'connect.sid=xxx',
    'other.cookie=yyy',
  ]);

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
    'connect.sid=xxx',
    'other.cookie=yyy',
    'connect.sid_expiry=2025-04-07T12%3A34%3A56.000Z',
  ]);
});

test('should track session cookie with custom name', () => {
  const date = new Date('2025-04-07T12:34:56Z');
  const req = {
    session: {
      cookie: {
        expires: date,
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry({sessionName: 'custom:session'})(req, res, next);

  // Mock header written by express-session
  res.getHeader.mockReturnValue('custom:session=xxx');

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
    'custom:session=xxx',
    'custom:session_expiry=2025-04-07T12%3A34%3A56.000Z',
  ]);
});

test('should use custom name for tracker cookie', () => {
  const date = new Date('2025-04-07T12:34:56Z');
  const req = {
    session: {
      cookie: {
        expires: date,
        data: {}
      }
    }
  };
  const res = {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    writeHead: jest.fn(),
  };
  const next = jest.fn();

  trackCookieExpiry({trackerName: 'custom:tracker'})(req, res, next);

  // Mock header written by express-session
  res.getHeader.mockReturnValue('connect.sid=xxx');

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
    'connect.sid=xxx',
    'custom:tracker=2025-04-07T12%3A34%3A56.000Z',
  ]);
});
