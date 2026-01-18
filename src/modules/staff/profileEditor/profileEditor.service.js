// src/modules/staff/profileEditor/profileEditor.service.js

const { getDb } = require("../../../database/sqlite");
const { ensureCompetitiveProfile, getCompetitiveProfile } = require("../../global/profiles/profile.service");

const { getAllowedKeys } = require("./profileEditor.ui.helpers");

function now() {
  return Date.now();
}

function updateStat(targetId, field, value) {
  const allowed = getAllowedKeys();
  if (!allowed.includes(field)) {
    throw new Error(`Field not allowed: ${field}`);
  }

  const db = getDb();
  ensureCompetitiveProfile(targetId);

  db.prepare(
    `
    UPDATE competitive_profile
    SET ${field} = ?, updatedAt = ?
    WHERE userId = ?
    `
  ).run(value, now(), targetId);

  return getCompetitiveProfile(targetId);
}

function updateMany(targetId, patch = {}) {
  const keys = Object.keys(patch);
  const allowed = getAllowedKeys();

  for (const k of keys) {
    if (!allowed.includes(k)) {
      throw new Error(`Field not allowed: ${k}`);
    }
  }

  if (keys.length === 0) return getCompetitiveProfile(targetId);

  const db = getDb();
  ensureCompetitiveProfile(targetId);

  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => patch[k]);

  db.prepare(
    `
    UPDATE competitive_profile
    SET ${sets}, updatedAt = ?
    WHERE userId = ?
    `
  ).run(...values, now(), targetId);

  return getCompetitiveProfile(targetId);
}

function addToStat(targetId, field, delta) {
  const profile = getCompetitiveProfile(targetId);
  const current = Number(profile?.[field] || 0);
  return updateStat(targetId, field, current + delta);
}

function setZero(targetId, field) {
  return updateStat(targetId, field, 0);
}

module.exports = {
  updateStat,
  updateMany,
  addToStat,
  setZero,
};
