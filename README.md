# express-sdk
[![CI](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/quickcase/express-sdk/actions/workflows/ci.yml)

Development kit to build QuickCase-flavoured ExpressJS applications

## Documentation

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
