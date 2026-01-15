/**
 * src/domain/ranks.js
 *
 * [CRITICAL][INTEGRITY]
 * Ranking definitions must stay consistent across commands, /perfil and matchmaking.
 * Rank colors/roles/emojis are part of your server identity.
 */

const RANKS = {
  UNRANKED: { key: "UNRANKED", namePt: "Sem Rank", nameEn: "Unranked", color: 0x0b0b0b, roleId: null, emoji: "👤" },

  COBRE:   { key: "COBRE",   namePt: "Cobre",   nameEn: "Copper",   color: 0x992f19, roleId: "1458787560863174729", emoji: "<:comp_cobre:1458792661975564472>" },
  FERRO:   { key: "FERRO",   namePt: "Ferro",   nameEn: "Iron",     color: 0x5f4f6a, roleId: "1457349081943773296", emoji: "<:comp_ferro:1458792728295903233>" },
  BRONZE:  { key: "BRONZE",  namePt: "Bronze",  nameEn: "Bronze",   color: 0xee6038, roleId: "1457353820332888108", emoji: "<:comp_bronze:1458792843861688502>" },
  PRATA:   { key: "PRATA",   namePt: "Prata",   nameEn: "Silver",   color: 0x959ec7, roleId: "1457349239360196854", emoji: "<:comp_prata:1458792923402469447>" },
  OURO:    { key: "OURO",    namePt: "Ouro",    nameEn: "Gold",     color: 0xffe1b4, roleId: "1453328539901497395", emoji: "<:comp_ouro:1458793814381691024>" },
  DIAMANTE:{ key: "DIAMANTE",namePt: "Diamante",nameEn: "Diamond",  color: 0x9e6bff, roleId: "1457349311732912189", emoji: "<:comp_diamante:1458794140308476031>" },
};

function getRankByMemberRoles(member) {
  if (!member) return RANKS.UNRANKED;
  const roleIds = new Set(member.roles.cache.map(r => r.id));
  for (const key of ["DIAMANTE","OURO","PRATA","BRONZE","FERRO","COBRE"]) {
    if (RANKS[key].roleId && roleIds.has(RANKS[key].roleId)) return RANKS[key];
  }
  return RANKS.UNRANKED;
}

module.exports = { RANKS, getRankByMemberRoles };


function getRankByXp(xp){
  const sorted=[...RANKS].sort((a,b)=>a.threshold-b.threshold);
  let current=null;
  for (const r of sorted){ if (xp>=r.threshold) current=r; }
  return current;
}

module.exports.getRankByXp=getRankByXp;
