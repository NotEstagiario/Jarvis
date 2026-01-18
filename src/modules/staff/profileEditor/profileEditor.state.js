// src/modules/staff/profileEditor/profileEditor.state.js

const state = new Map();

function getState(staffId) {
  return state.get(staffId) || null;
}

function setState(staffId, data) {
  state.set(staffId, {
    ...data,
    updatedAt: Date.now(),
  });
}

function clearState(staffId) {
  state.delete(staffId);
}

module.exports = {
  getState,
  setState,
  clearState,
};
