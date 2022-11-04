const QUICKCASE_CLAIMS = Object.freeze({
  sub: {
    defaultName: 'sub',
  },
  name: {
    defaultName: 'name',
  },
  email: {
    defaultName: 'email',
  },
  roles: {
    defaultName: 'app.quickcase.claims/roles',
    defaultValue: '',
    prefix: true,
    parser: (roles) => roles ? roles.split(',') : [],
  },
  organisations: {
    defaultName: 'app.quickcase.claims/organisations',
    defaultValue: '{}',
    prefix: true,
    parser: JSON.parse,
  },
});

const claimProcessor = (prefix, names) => (claims) => (key, def) => {
  const name = names[key] || def.defaultName;
  const prefixedName = def.prefix ? prefix + name : name;
  const rawValue = claims[prefixedName] || def.defaultValue;
  return def.parser ? def.parser(rawValue) : rawValue;
}

export const quickcaseClaimsProcessor = (claimsConfig = {}) => (claims) => {
  const prefix = claimsConfig.prefix || '';
  const names = claimsConfig.names || {};

  const processClaim = claimProcessor(prefix, names)(claims);

  return Object.fromEntries(Object.entries(QUICKCASE_CLAIMS).map(([key, def]) => [key, processClaim(key, def)]));
};