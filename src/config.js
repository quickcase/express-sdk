/**
 * Type-safe wrappers and shorthands for [config package]{@link https://www.npmjs.com/package/config}.
 * @module config
 */

import Config from 'config';

/**
 * Alias of `config.get()`. As this is not type-safe this should not be used,
 * please consider using {@link nullOr} and {@link asString}.
 *
 * @function
 * @param {string} property - Identifier of the property
 * @returns Raw value of the property
 */
export const raw = (property) => Config.get(property);

/**
 * Extract config value as boolean.
 *
 * @function
 * @param {string} property - Identifier of the property
 * @returns {boolean} True when the String value is exactly equals to `'true'` ignoring case; false otherwise
 */
export const asBoolean = (property) => asString(property).toLowerCase() === 'true';

/**
 * Extract config value as number.
 *
 * @function
 * @param {string} property - Identifier of the property
 * @returns {number} Number value of the property
 */
export const asNumber = (property) => Number(raw(property));

/**
 * Extract config value as string.
 *
 * @function
 * @param {string} property - Identifier of the property
 * @returns {string} String value of the property
 */
export const asString = (property) => String(raw(property));

/**
 * Extract config value as `null` or defer typing to type-safe wrapper otherwise.
 *
 * @function
 * @param {function} typeFn - Type-safe wrapper
 * @param {string} property - Identifier of the property
 * @returns Either `null` or the value of the property as typed by `typeFn`
 */
export const nullOr = (typeFn) => (property) => raw(property) === null ? null : typeFn(property);

/**
 * Extract config value as boolean.
 *
 * @function
 * @param {string} prefix - Prefix to use for all properties of the shorthand, including trailing `.` separator if required
 * @param {string} property - Identifier of the property which will be appended to the prefix
 * @param {function} typeFn - Optional type-safe wrapper to use for the property, defaults to `nullOr(asString)`
 * @returns {boolean} True when the String value is exactly equals to `'true'` ignoring case; false otherwise
 */
export const shorthand = (prefix) => (property, typeFn = nullOr(asString)) => typeFn(prefix + property);
