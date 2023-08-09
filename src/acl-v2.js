/**
 * @module AclV2
 *
 * This differs of Acl (v1) by expecting ACLs to be objects where keys are the roles and values are 4-bit binary numbers
 * with each bit respectively being from left to right: Create, Read, Update and Delete (CRUD).
 * Hence, denying all permissions can be explicitly represented as 0.
 */

export const CREATE = 0b1000;
export const READ = 0b0100;
export const UPDATE = 0b0010;
export const DELETE = 0b0001;

export const CRUD = CREATE | READ | UPDATE | DELETE;

const LETTERS = Object.freeze({'C': CREATE, 'R': READ, 'U': UPDATE, 'D': DELETE});

/**
 * Check whether the provided ACL grants the requested verb for the given user roles.
 *
 * @param {number} verb - ACL verb to check for
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {Object.<string, number>} acl - ACL of the entity
 * @return {string | boolean} `false` if access is denied, the relevant role from the ACL if access is granted
 */
export const check = (verb) => (userRoles) => (acl) =>
  acl && userRoles.find((role) => acl[role] && (acl[role] & verb) > 0) || false;

/**
 * Check whether the provided ACL grants at least one of the requested verbs for the given user roles.
 *
 * @param {number[]} verbs - ACL verbs to check for, at least one of the verb must be granted
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {Object.<string, number>} acl - ACL of the entity
 * @return {string | boolean} `false` if access is denied, the relevant role from the ACL if access is granted
 */
export const checkAny = (verbs) => {
  const combinedVerbs = verbs.reduce((acc, verb) => acc | verb, 0);
  return check(combinedVerbs);
};

/**
 * Check whether the provided ACL grants all of the requested verbs for the given user roles.
 *
 * @param {number[]} verbs - ACL verbs to check for, all the verbs must be granted, the verbs can be granted through different roles
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {Object.<string, number>} acl - ACL of the entity
 * @return {string[] | boolean} `false` if access is denied, the combination of relevant roles from the ACL if access is granted
 */
export const checkAll = (verbs) => (userRoles) => (acl) => {
  const combinedVerbs = verbs.reduce((acc, verb) => acc | verb, 0);
  const effectivePermissions = userRoles.reduce((acc, role) => acc | acl[role], 0);

  return (combinedVerbs & effectivePermissions) === combinedVerbs ? userRoles : false;
};

/**
 * Convert a legacy ACL (v1) into an ACL V2.
 *
 * @param {Array.<Object>} legacyAcl
 */
export const fromLegacy = (legacyAcl) => Object.fromEntries(
  legacyAcl.map((item) => [item.role, toBinary(item)])
);

/**
 * Converts a string or legacy permission object to its equivalent 4-bit binary number.
 *
 * @param {string|Object} permission - Either a `'CRUD'` string or a legacy permission object (v1)
 * @return {number} - 4-bit binary representation of the permission
 */
export const toBinary = (permission) => {
  if (!permission) {
    return 0;
  }

  if (typeof permission === 'string') {
    return permission.split('')
                     .map((char) => LETTERS[char.toUpperCase()])
                     .reduce((acc, verb) => acc | verb, 0);
  }

  return (permission.create && CREATE)|(permission.read && READ) | (permission.update && UPDATE) | (permission.delete && DELETE);
};