/**
 * src/services/permissionService.js
 *
 * [SECURITY]
 * Central permission system.
 */

const { STAFF_ROLES } = require("../config/constants");
const { isOwner } = require("./ownerService");

function hasRole(member, roleId) {
  return !!member?.roles?.cache?.has(roleId);
}

function isStaff(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return (
    hasRole(member, STAFF_ROLES.PRESIDENT) ||
    hasRole(member, STAFF_ROLES.VICE_PRESIDENTS) ||
    hasRole(member, STAFF_ROLES.COUNCIL)
  );
}

module.exports = { hasRole, isStaff };
