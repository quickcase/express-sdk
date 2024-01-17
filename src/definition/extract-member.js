import {METADATA_START} from './extract-field';

/**
 * Creates an instance of a relative definition extractor for members of a complex field.
 *
 * @param {function} extract - Primed extract function, either `extractField` or `extractMember`
 * @param {string} complexPath - Path to parent complex field
 * @returns {function(*): *} Extract function relative to complex parent
 */
const extractMember = (extract, complexPath) => (path) => {
  const resolver = resolvePath(complexPath);
  return extract(processPath(resolver)(path));
};

const resolvePath = (parentPath) => (path) => {
  if (path[0] === METADATA_START) {
    return path;
  }
  return parentPath + '.' + path;
};

const processPath = (resolve) => (path) => {
  if (typeof path === 'string') {
    return resolve(path);
  } else if (Array.isArray(path)) {
    return path.map(resolve);
  } else if (typeof path === 'object' && path !== null) {
    return Object.fromEntries(
      Object.entries(path).map(([k, p]) => [k, resolve(p)])
    );
  }

  return path;
};

export default extractMember;
