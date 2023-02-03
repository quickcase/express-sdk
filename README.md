# express-sdk
[![CI](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml)

Development kit to build QuickCase-flavoured ExpressJS applications.

Supported NodeJS versions:
* 16
* 18

## Documentation

### ACL

Set of helpers to work with QuickCase's Access Control List.

#### check(verb)(userRoles)(acl)

Parameters:
- verb: `string`, one of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants the `verb` to any of the provided `userRoles`.

#### checkAny(verbs)(userRoles)(acl)

Parameters:
- verbs: `string[]`, list of one or many of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants at least one (any) of the `verbs` to any of the provided `userRoles`.

#### checkAll(verbs)(userRoles)(acl)

Parameters:
- verbs: `string[]`, list of one or many of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants every one (all) of the `verbs` through one or many of the provided `userRoles`.

### API clients

#### ApiClient(factory)(options)(req)

Build a new instance of an API client where:
* `factory`: A function called with an Axios instance as argument and returning a map of available API functions to be exposed by the client
* `options`: An object composed of:
  * `baseURL`: String, required. The base URL to use for all API calls made by the Axios instance.
  * `accessTokenProvider`: Function, optional. Async function taking the ExpressJS Request as argument and returning the Promise of an access token to use as Authorization Bearer.
* `req`: ExpressJS Request object to tie API call abort signal to the request's own abort signal.

Example usage:

```js
import {ApiClient} from '@quickcase/express-sdk';

const DefinitionApiClient = ApiClient((axiosInstance) => ({
  getType: (typeId) => axiosInstance.get(`/api/data/case-type/${typeId}`, {
    headers: {
      'accept': 'application/vnd.app.quickcase.store.definition.api.case-type.v2+json;charset=UTF-8',
    },
  }),
}));

const client = DefinitionApiClient({
  baseURL: 'https://test.quickcase.app',
  accessTokenProvider: (req) => Promise.resolve('access-token-123'),
})(req);

const type1 = await client.getType('type-1');
```

### Async

#### asyncMiddleware(middleware)

In Express v4, errors thrown in async functions within a middleware must be manually caught and passed to `next()`.
In Express v5, this will be done automatically.
In the meantime, this decorator offers a behaviour similar to the one of Express v5 where any decorated middleware
returning a Promise will automatically call `next(error)` whenever the promise is rejected.

Usage:

```js
import {asyncMiddleware} from '@quickcase/express-sdk';

const unsafeMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Some async code throwing an error
      reject('error');
    }, 1);
  })
};

const safeMiddleware = asyncMiddleware(unsafeMiddleware);
```

### Condition

Parsing and evaluation of conditional logic for cases.

#### parse(conditionString)

Validate condition syntax and parse the condition into a normalised 2-dimensional array of criteria where the first
dimension represents disjunctions (OR) and the second dimension represents conjunctions (AND).

Usage:
```js
import {Condition} from '@quickcase/express-sdk';

const condition = Condition.parse(`
  complex.field1 = "value 1" AND (
    field2 === "value 2" OR NOT field3 MATCHES "^[a-z]+"
  )
`);

//Output:
[
  [
    {path: 'complex.field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true},
    {path: 'field2', operator: 'EQUALS', value: 'value 2'},
  ],
  [
    {path: 'complex.field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true},
    {path: 'field3', operator: 'MATCHES', value: '^[a-z]+', negated: true},
  ],
]
```

### Config

Uses [config](https://www.npmjs.com/package/config) combined with [js-yaml](https://www.npmjs.com/package/js-yaml) to load and consume YAML-based configurations using type-safe wrapper and shorthands.

#### Example

Given config:
```yml
level1:
  level2:
    null: null
    number: 1337
    numberStr: '42'
    trueStr: 'true'
```

Then:
```js
import {Config} from '@quickcase/express-sdk';

const {asBoolean, asNumber, asString, nullOr, raw, shorthand} = Config;

const level2 = shorthand('level1.level2.');

level2('null'); // => null
level2('number'); // => '1337'

level2('null', raw); // => null
level2('null', asString); // => 'null'
level2('numberStr', asNumber); // => 42
level2('trueStr', asBoolean); // => true
level2('numberStr', asBoolean); // => false

level2('null', nullOr(asNumber)); // => null
level2('number', nullOr(asNumber)); // => 1337
```

### Logging

#### AccessLogger

Express middleware generating access log upon response termination (finished or interrupted).

```js
import {AccessLogger} from '@quickcase/express-sdk';

//...

const app = express();

app.use(AccessLogger());
```

The access logger middleware can be customised by providing an optional config object formed of:
- `logger`: Optional, a Winston's logger instance (see Logger below); use default logger if omitted
- `formatter`: Optional, a function formatting the req/res pair into a string message; use default formatter if omitted
- `levelSupplier`: Optional, a function supplying the logging level for a given req/res pair; use default level supplier if omitted

#### Logger

Pre-configured Winston logger factory.

```js
import {Logger} from '@quickcase/express-sdk';

const logger = Logger('a-logger-name');

logger.debug('a debug message');
logger.http('a http message');
logger.info('an info message');
logger.warn('a warn message');
logger.error('an error message');

// Or using the object form:
logger.info({
  message: 'an info message',
  other: 'property',
});

// Or using the generic log method:
logger.log({
  level: 'info',
  message: 'an info message',
  other: 'property',
});

```

### OpenID

OpenID Relying Party integration built on top of [node-openid-client](https://github.com/panva/node-openid-client).
`openid-client` is a peer dependency and must be explicitly installed in addition to `@quickcase/express-sdk`:

```bash
npm install openid-client
```

See [quickcase/express-react-template](https://github.com/quickcase/express-react-template) for example usage.


### Test

#### givenMiddleware(middleware)

Given/when/then-like syntax for asynchronously executing ExpressJS middlewares.

This helper is either used to expect and wait for a response:
```js
const res = await givenMiddleware(middleware).when(req).expectResponse();
```

Or to expect and wait for a call to `next()`:
```js
const next = await givenMiddleware(middleware).when(req).expectNext();
```

For example:

```js
import {givenMiddleware} from '@quickcase/express-sdk';

test('should resolve with response when response expected', async () => {
  const middleware = (req, res) => res.status(201).json({foo: 'bar'});

  const res = await givenMiddleware(middleware).when({}).expectResponse();

  expect(res).toEqual({
    status: 201,
    headers: {},
    body: {foo: 'bar'},
  });
});

test('should resolve with next when next expected', async () => {
  const middleware = (req, res, next) => next('error');

  const next = await givenMiddleware(middleware).when({}).expectNext();

  expect(next).toEqual('error');
});
```
