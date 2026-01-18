// src/utils/admin.js

const azyron = require("../config/azyronIds");

function isPresident(userId) {
  return String(userId) === String(azyron.presidentUserId);
}

function hasRole(member, roleId) {
  if (!roleId) return false;
  return Boolean(member?.roles?.cache?.has(roleId));
}

/**
 * Admin (Word):
 * - presidenteUserId sempre bypass
 * - roles: staff | president | vicePresident | council
 */
function isAdminWord(member, userId) {
  if (isPresident(userId)) return true;

  return (
    hasRole(member, azyron.roles.staff) ||
    hasRole(member, azyron.roles.president) ||
    hasRole(member, azyron.roles.vicePresident) ||
    hasRole(member, azyron.roles.council)
  );
}

module.exports = {
  isPresident,
  isAdminWord,
};
