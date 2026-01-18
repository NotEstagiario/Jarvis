// src/modules/staff/resetar/resetar.state.js

const STATE = new Map();

function createRequest(data) {
  const id = String(Date.now()) + "_" + String(Math.floor(Math.random() * 9999));

  const req = {
    id,

    // type:
    // - STATS_GLOBAL
    // - GLOBAL_ALL
    type: data.type,

    staffId: data.staffId,
    staffLang: data.staffLang,

    justification: data.justification,
    passwordOk: Boolean(data.passwordOk),

    status: "pending", // pending | authorized | denied
    createdAt: Date.now(),

    // runtime references
    requestChannelId: data.requestChannelId || null,
    requestMessageId: data.requestMessageId || null,
  };

  STATE.set(id, req);
  return req;
}

function getRequest(id) {
  return STATE.get(String(id));
}

function updateRequest(id, patch) {
  const req = STATE.get(String(id));
  if (!req) return null;

  Object.assign(req, patch || {});
  STATE.set(String(id), req);
  return req;
}

function deleteRequest(id) {
  STATE.delete(String(id));
}

function sweepOld(maxAgeMs = 1000 * 60 * 60) {
  const now = Date.now();
  for (const [id, req] of STATE.entries()) {
    if (!req?.createdAt) continue;
    if (now - req.createdAt > maxAgeMs) STATE.delete(id);
  }
}

module.exports = {
  createRequest,
  getRequest,
  updateRequest,
  deleteRequest,
  sweepOld,
};
