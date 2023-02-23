import {SyntaxError} from './errors';
import parse from './parse-condition';
import evaluate from './evaluate.js';

export {
  evaluate,
  parse,
  SyntaxError,
};