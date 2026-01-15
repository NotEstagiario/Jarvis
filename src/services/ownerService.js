/**
 * src/services/ownerService.js
 *
 * [SECURITY][OWNER]
 * Owner bypass must remain strict. Do NOT remove without understanding consequences.
 */

const { OWNER_ID } = require("../config/constants");

function isOwner(userId) {
  return String(userId) === String(OWNER_ID);
}

module.exports = { isOwner };
