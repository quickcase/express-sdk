import Mustache from 'mustache';
import {relativeExtractor} from '../record/index.js';

const COERCE_BOOL_SUFFIX = '?';
const TEMPLATE_VALUE_PATTERN = /{{{?[#^]?((?:@\.)?[a-zA-Z0-9._\[\]:]+)[?]?}?}}/g;

const RecordContext = (extractor) => {
  const context = new Mustache.Context();

  let lastLookup = null;

  const recordLastLookup = (path, value) => {
    lastLookup = {path, value};
  };

  const pathForView = (view) => {
    if (Array.isArray(lastLookup?.value)) {
      // Build path to array item by index
      return `${lastLookup.path}[${lastLookup.value.indexOf(view)}]`;
    }
    return lastLookup.path;
  };

  context.lookup = (path) => {
    // Coerce to boolean when `?` suffix used in path
    if (path.slice(-COERCE_BOOL_SUFFIX.length) === COERCE_BOOL_SUFFIX) {
      path = path.slice(0, -COERCE_BOOL_SUFFIX.length);
      const value = extractor(path);
      recordLastLookup(path, value);
      return value && value.toLowerCase() === 'yes';
    }
    const value = extractor(path);
    recordLastLookup(path, value);
    return value;
  };

  context.push = (view) => RecordContext(relativeExtractor(extractor, pathForView(view)));

  return context;
};

/**
 * Render templates in the context of a record using field paths as the notation for variable interpolation.
 * For template syntax and capabilities, see http://mustache.github.io/mustache.5.html
 *
 * @param extractor Record extractor used to resolve field paths
 * @return {function(string): string} rendering function
 */
export const renderer = (extractor) => {
  const context = RecordContext(extractor);

  return (template) => Mustache.render(template, context);
};

export const parse = (template) => {
  return [...template.matchAll(TEMPLATE_VALUE_PATTERN)].map(([, firstGroup]) => firstGroup);
};
