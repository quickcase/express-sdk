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
