// src/modules/staff/profileEditor/profileEditor.constants.js

const MENU = {
  MAIN: "MAIN",
  PICK_STAT: "PICK_STAT",
  EDIT: "EDIT",

  // flows especiais
  RIVALRIES_MENU: "RIVALRIES_MENU",
  RIVALRIES_PICK_USER: "RIVALRIES_PICK_USER",
  RIVALRIES_SET_VALUE: "RIVALRIES_SET_VALUE",
  RIVALRIES_BESTWIN_STEP_FOR: "RIVALRIES_BESTWIN_STEP_FOR",
  RIVALRIES_BESTWIN_STEP_AGAINST: "RIVALRIES_BESTWIN_STEP_AGAINST",

  BADGES_MENU: "BADGES_MENU",

  // 🆕 rank selector
  RANK_MENU: "RANK_MENU",
};

const SECTIONS = {
  PLAYER: "PLAYER",
  BADGES: "BADGES",
  MATCHES: "MATCHES",
  GOALS: "GOALS",
  RIVALRIES: "RIVALRIES",
};

const BTN = {
  MAIN_PLAYER: "editprofile_main_player",
  MAIN_BADGES: "editprofile_main_badges",
  MAIN_MATCHES: "editprofile_main_matches",
  MAIN_GOALS: "editprofile_main_goals",
  MAIN_RIVALRIES: "editprofile_main_rivalries",

  BACK_MAIN: "editprofile_back_main",
  BACK_STATS: "editprofile_back_stats",

  // stat picker prefix
  PICK_PREFIX: "editprofile_pick_",

  // edit actions
  ACT_PLUS_100: "editprofile_act_plus100",
  ACT_PLUS_10: "editprofile_act_plus10",
  ACT_PLUS_5: "editprofile_act_plus5",
  ACT_ZERO: "editprofile_act_zero",
  ACT_MINUS_100: "editprofile_act_minus100",
  ACT_MINUS_10: "editprofile_act_minus10",
  ACT_MINUS_5: "editprofile_act_minus5",
  ACT_SET_CUSTOM: "editprofile_act_set_custom",

  CONFIRM: "editprofile_confirm",

  // ========================================================
  // BADGES flow
  // ========================================================
  BADGES_OPEN: "editprofile_badges_open",
  BADGES_BACK: "editprofile_badges_back",

  // ========================================================
  // 🆕 RANK selector (Word)
  // ========================================================
  RANK_OPEN: "editprofile_rank_open",

  // ========================================================
  // RIVALRIES flow (Word)
  // ========================================================
  RIVALRIES_OPEN: "editprofile_rivalries_open",
  RIVALRIES_BACK: "editprofile_rivalries_back",

  RIVALRIES_SET_NEMESIS: "editprofile_rivalries_set_nemesis",
  RIVALRIES_SET_FAVORITE: "editprofile_rivalries_set_favorite",
  RIVALRIES_SET_BESTWIN: "editprofile_rivalries_set_bestwin",

  // ========================================================
  // 🆕 RIVALRIES continue buttons (fix modal chaining)
  // ========================================================
  RIVALRIES_CONTINUE_NEMESIS: "editprofile_rivalries_continue_nemesis",
  RIVALRIES_CONTINUE_FAVORITE: "editprofile_rivalries_continue_favorite",
  RIVALRIES_CONTINUE_BESTWIN_FOR: "editprofile_rivalries_continue_bestwin_for",
  RIVALRIES_CONTINUE_BESTWIN_AGAINST: "editprofile_rivalries_continue_bestwin_against",
};

const MODAL = {
  SET_CUSTOM: "editprofile_modal_set_custom",
  JUSTIFY: "editprofile_modal_justify",

  // ========================================================
  // RIVALRIES modals (Word)
  // ========================================================
  RIVALRIES_PICK_USER: "editprofile_modal_rivalries_pick_user",
  RIVALRIES_NEMESIS_VALUE: "editprofile_modal_rivalries_nemesis_value",
  RIVALRIES_FAVORITE_VALUE: "editprofile_modal_rivalries_favorite_value",
  RIVALRIES_BESTWIN_FOR: "editprofile_modal_rivalries_bestwin_for",
  RIVALRIES_BESTWIN_AGAINST: "editprofile_modal_rivalries_bestwin_against",
};

module.exports = {
  MENU,
  SECTIONS,
  BTN,
  MODAL,
};
