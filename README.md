# express-sdk
[![CI](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml)

Development kit to build QuickCase-flavoured ExpressJS applications.

Supported NodeJS versions:
* 16 (deprecated)
* 18
* 20

## Documentation

### ACL

Set of helpers to work with QuickCase's Access Control List.

#### check(verb)(userRoles)(acl)

Parameters:
- verb: `string`, one of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object[]`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants the `verb` to any of the provided `userRoles`.

#### checkAny(verbs)(userRoles)(acl)

Parameters:
- verbs: `string[]`, list of one or many of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object[]`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants at least one (any) of the `verbs` to any of the provided `userRoles`.

#### checkAll(verbs)(userRoles)(acl)

Parameters:
- verbs: `string[]`, list of one or many of `'create'`, `'read'`, `'update'` or `'delete'`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `object[]`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants every one (all) of the `verbs` through one or many of the provided `userRoles`.

### ACL v2

Set of helpers to work with QuickCase's Access Control List version 2.

Differences in version 2 compared to version 1 (legacy):
- Use 4-bit binary numbers to represent permissions where bits from left to rights are `C`, `R`, `U` and `D`
- Group permissions by role into an object where keys are the role and values the permissions

Where in v1 an ACL would be:
```js
const acl = [
  {role: 'role-1', create: true, read: true, update: false, delete: false},
  {role: 'role-2', create: true, read: true, update: true, delete: true},
]
```

In v2, that same ACL will be:
```js
const acl = {
  'role-1': 0b1100, // 12
  'role-2': 0b1111, // 15
}
```

#### check(verb)(userRoles)(acl)

Parameters:
- verb: `number`, a single verb to check for (one of `AclV2.CREATE`, `AclV2.READ`, `AclV2.UPDATE` or `AclV2.DELETE`)
- userRoles: `string[]`, list of roles assigned to the user
- acl: `Object.<string, number>`, the ACL object to evaluate

Returns a truthy value (the effective role) if the ACL grants the `verb` to any of the provided `userRoles`.

```js
import {AclV2} from '@quickcase/express-sdk';

const userRoles = ['role-1', 'role-2'];
const acl = {
  'role-1': AclV2.CREATE,
  'role-2': AclV2.READ | AclV2.UPDATE,
};

AclV2.check(AclV2.CREATE)(userRoles)(acl);
// Returns: 'role-1'

AclV2.check(AclV2.READ)(userRoles)(acl);
// Returns: 'role-2'

AclV2.check(AclV2.DELETE)(userRoles)(acl);
// Returns: false
```

#### checkAny(verbs)(userRoles)(acl)

Parameters:
- verbs: `number[]`, one or many of `AclV2.CREATE`, `AclV2.READ`, `AclV2.UPDATE` or `AclV2.DELETE`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `Object.<string, number>`, the ACL object to evaluate

Returns a truthy value (the effective role) if the ACL grants at least one (any) of the `verbs` to any of the provided `userRoles`.

#### checkAll(verbs)(userRoles)(acl)

Parameters:
- verbs: `number[]`, one or many of `AclV2.CREATE`, `AclV2.READ`, `AclV2.UPDATE` or `AclV2.DELETE`
- userRoles: `string[]`, list of roles assigned to the user
- acl: `Object.<string, number>`, the ACL object to evaluate

Returns a truthy value (the effective permission) if the ACL grants every one (all) of the `verbs` through one or many of the provided `userRoles`.

#### fromLegacy(legacyAcl)

Parameters:
- legacyAcl: `Object[]`, a legacy ACL as per version 1

Returns the equivalent v2 ACL.

#### toBinary(permission)

Parameters:
- permission: `string` or `Object`, either a `'CRUD'` string or a legacy permission object (v1)

Returns the 4-bit binary representation of the permission.

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

#### evaluate(extractor)(condition)

Evaluates a parsed condition against an instance of a record.

Parameters:
- `extractor`: Instance of `Record.extractor` partially applied with a record
- `condition`: Condition object, as returned by `Condition.parse`

Returns a `boolean` with a value of `true` if the condition matched the record instance, `false` otherwise.

```js
import {Condition, Record} from '@quickcase/express-sdk';

const record = {...};
const extractor = Record.extractor(record);
const condition = Condition.parse(...);

Condition.evaluate(extractor)(condition);
// -> true or false
```

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
{
  disjunctions: [
    [
      {path: 'complex.field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true},
      {path: 'field2', operator: 'EQUALS', value: 'value 2'},
    ],
    [
      {path: 'complex.field1', operator: 'EQUALS', value: 'value 1', ignoreCase: true},
      {path: 'field3', operator: 'MATCHES', value: '^[a-z]+', negated: true},
    ],
  ],
  fieldPaths: ['complex.field1', 'field2', 'field3'],
}
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

### Definition

#### extractField(normalisedFields)(path)

Extract the definition of a metadata or field from the given normalised field definitions using the field path.

:warning: Please note, this relies on normalised field definitions, as returned by `Definition.normaliseFields(fields)`.

- When path is a `string`: Definition of the specified field; or undefined if path cannot be found in fields.
- When path is an `array`: An array of the same size, with extracted definitions in the same position as their respective path. Paths not found are extracted as undefined.
- When path is an `object`: An object of the same shape, with extracted definitions in place of the paths. Paths not found are extracted as undefined.

This function aims to mirror `Record.extractor()`.

```js
import {Definition} from '@quickcase/express-sdk';

const fields = {...}; // As returned by Definition.normaliseFields(fields)

const extractor = Definition.extractField(fields);

// Extracting metadata definition
extractor('[workspace]');
extractor('[type]');
extractor('[state]');
extractor('[id]');
extractor('[classification]');
extractor('[created]');
extractor('[modified]');

// Extracting field definition
extractor('field1');
extractor('level1.level2.nestedField');

// Extracting definition of collection items
extractor('collectionField[].value'); // Any item
extractor('collectionField[0].value'); // By item index, zero-based
extractor('collectionField[id:abc123].value'); // By item ID

// Extracting multiple path at once
extractor(['[state]', 'field1', 'field2']);
extractor({state: '[state]', someField: 'path.to.some.field'});
```

#### normaliseFields(fields)

Normalises an array of fields returned as part of a case type by definition-store into a structure easier to consume.

This includes:
- Trimming all null/empty properties to reduce payloads
- Explicitly inheriting ACL from complex parents to their members and from collection to their content
- Applying ACL overrides on complex members and collection content
- Converting ACLs into objects of binary permissions (ACL v2)
- Sorting array elements with explicit `order` property and dropping the `order` property

The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
required any longer.

```js
import {Definition} from '@quickcase/express-sdk';

const fields = [
  // Array of field definitions as returned by definition-store 
];

Definition.normaliseFields(fields)
// Returns: Object, normalised fields indexed by ID
```

#### normaliseActionLayout(fields)(action, layout)

Normalises the layout of an action (steps and submit).
This includes:
- Ordering steps, columns, fields and composite field members (removing need for `order` property)
- Normalising step structure
- Normalising step fields
- Explicitly expanding the layout of composite fields without overrides from their definition (incl. member condition)
- Explicitly expanding the layout of composite fields with overrides from their overrides

The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
required any longer.

```js
import {Definition} from '@quickcase/express-sdk';

const fields = {
  // Object of fields, as returned by `Definition.normaliseFields()`
};

const action = {
  // Object as returned by definition-store as part of case type (JSON path: .events)
};

const layout = {
  // Object as returned by definition-store as wizard pages
}

Definition.normaliseActionLayout(fields)(action, layout)
// Returns: Object, normalised steps and submit layout
```

#### normaliseStates(states)

Normalises an array of states returned as part of a case type by definition-store into a structure easier to consume.

This includes:
- Trimming all null/empty properties to reduce payloads
- Converting ACLs into objects of binary permissions (ACL v2)

The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
required any longer.

```js
import {Definition} from '@quickcase/express-sdk';

const states = [
  // Array of states definitions as returned by definition-store 
];

Definition.normaliseStates(states)
// Returns: Object, normalised states indexed by ID
```

#### normaliseViewLayout(fields)(layout)

Normalises the layout of the record view (tabs).
This includes:
- Ordering groups, fields and composite field members (removing need for `order` property)
- Normalising group structure
- Normalising group fields
- Explicitly expanding the layout of composite fields without overrides from their definition (incl. member condition)

The resulting structure is closely aligned with anticipated contract of definition-store v5, hence future-proofing
consumers of the normalised structure. Upon release of definition-store v5, this normalisation process should not be
required any longer.

```js
import {Definition} from '@quickcase/express-sdk';

const fields = {
  // Object of fields, as returned by `Definition.normaliseFields()`
};

const layout = {
  // Object as returned by definition-store as display/tab-structure
}

Definition.normaliseViewLayout(fields)(action, layout)
// Returns: Object, normalised groups for record view
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

### Record

#### extractor(record)(path)

Extract the value of a metadata or field from the given record using the field path.

- When path is a `string`: Value of the specified field; or undefined if path cannot be found in case data.
- When path is an `array`: An array of the same size, with extracted values in the same position as their respective path. Paths not found are extracted as undefined.
- When path is an `object`: An object of the same shape, with extracted values in place of the paths. Paths not found are extracted as undefined.

```js
import {Record} from '@quickcase/express-sdk';

const record = {...}; // As retrieved from data-store

const extractor = Record.extractor(record);

// Extracting metadata
extractor('[workspace]');
extractor('[type]');
extractor('[state]');
extractor('[id]');
extractor('[classification]');
extractor('[created]');
extractor('[modified]');

// Extracting data field
extractor('field1');
extractor('level1.level2.nestedField');

// Extracting from collection items
extractor('collectionField[0].value'); // By item index, zero-based
extractor('collectionField[id:abc123].value'); // By item ID

// Extracting multiple path at once
extractor(['[state]', 'field1', 'field2']); // -> ['Created', 'Value 1', 'Value 2']
extractor({state: '[state]', someField: 'path.to.some.field'}); // -> {state: 'Created', someField: 'some value'}
```

#### relativeExtractor(extractor, basePath)(path)

Decorate an extractor with support for field paths relative to the provided base path.
Relative paths are always prefixed with `@.`.
When using a relative extractor, absolute field paths (ie. not starting with relative prefix) are still supported.

```js
import {Record} from '@quickcase/express-sdk';

const record = {
  data: {
    level0: {
      field1: 'value 1',
      field2: 'value 2',
    },
    rootField: 'root value',
  },
};

const rootExtractor = Record.extractor(record);
const level0Extractor = Record.relativeExtractor(rootExtractor, 'level0');

level0Extractor([
  '@.field1', // <-- path relative to base 'level0'
  '@.field2',
  '@.field3',
  'rootField', // <-- absolute path
]);
```

### Template

[Mustache](http://mustache.github.io/mustache.5.html) templates can be rendered using field paths extracted from a record.
This templating ability allows for example the injection of field values in otherwise static elements such as labels, hints and descriptions.

#### parse(template)

Parse and return all field paths used in a template.
This is useful to assess whether a template can be rendered definitively or depends on field paths which could change.

```js
import {Template} from '@quickcase/express-sdk';

Template.parse(`Hello {{firstName}}`);
// Output: ['firstName']

```

#### renderer(extractor)(template)

Using an extractor as context, renders a template into a string.
Both sections and inverted sections are supported in templates.
Fields with values `Yes` or `No` (case-insensitive) can be coerced into booleans by suffixing them with `?` for use as section conditions. 

```js
import {Record, Template} from '@quickcase/express-sdk';

const record = {
  data: {
    firstName: 'Henry'
  },
};
const extractor = Record.extractor(record);

Template.renderer(extractor)(`Hello {{firstName}}`);
// Output: 'Hello Henry'
```

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
