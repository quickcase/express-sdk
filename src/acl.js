
export const CREATE = 'create';
export const READ = 'read';
export const UPDATE = 'update';
export const DELETE = 'delete';

/**
 * Check whether the provided ACL grants the verb for the given user roles.
 *
 * @param {string} verb - ACL verb to check for
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {object[]} acl - ACL of the entity
 * @return {object | boolean} `false` if access is denied, the relevant permission from the ACL if access is granted
 */
export const check = (verb) => (userRoles) => (acl) => {
  return acl.find((permission) => userRoles.includes(permission.role) && permission[verb]) || false;
};

/**
 * Check whether the provided ACL grants at least one of the verbs for the given user roles.
 *
 * @param {string[]} verbs - ACL verbs to check for, at least one of the verb must be granted
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {object[]} acl - ACL of the entity
 * @return {object | boolean} `false` if access is denied, the relevant permission from the ACL if access is granted
 */
export const checkAny = (verbs) => (userRoles) => (acl) => {
  return acl.find((permission) => userRoles.includes(permission.role) && verbs.some((verb) => permission[verb])) || false;
};

/**
 * Check whether the provided ACL grants all of the verbs for the given user roles.
 *
 * @param {string[]} verbs - ACL verbs to check for, all the verbs must be granted, the verbs can be granted through different roles
 * @param {string[]} userRoles - Roles owned by the user being checked
 * @param {object[]} acl - ACL of the entity
 * @return {object | boolean} `false` if access is denied, the relevant permissions from the ACL if access is granted
 */
export const checkAll = (verbs) => (userRoles) => (acl) => {
  const denyAll = Object.fromEntries(verbs.map((verb) => [verb, false]));

  const effectiveAcl = acl.reduce((acc, permission) => {
    if (!userRoles.includes(permission.role)) {
      return acc;
    }

    return {
      ...acc,
      ...Object.fromEntries(
        verbs.filter((verb) => !acc[verb])
             .map((verb) => [verb, permission[verb] ? permission.role : false])
      ),
    };
  }, denyAll);

  return verbs.every((verb) => effectiveAcl[verb]) && effectiveAcl;
};
