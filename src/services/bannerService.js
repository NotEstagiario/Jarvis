/**
 * src/services/bannerService.js
 *
 * [CRITICAL][INTEGRITY]
 * Generates the final match result banner using base PNG + font.
 * Uses the exact coordinates provided by King N.
 *
 * Banner Resolution: 1536x1024
 */

const path = require("node:path");
const fs = require("node:fs");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { ASSETS } = require("../config/constants");

const COORDS = {
  homeImg: { x1: 247, x2: 524, y1: 512, y2: 802 },
  homeScore: { x1: 524, x2: 768, y1: 512, y2: 802, cx: 646, cy: 657 },
  awayScore: { x1: 768, x2: 1012, y1: 512, y2: 802, cx: 890, cy: 657 },
  awayImg: { x1: 1012, x2: 1289, y1: 512, y2: 802 },
};

function ensureFontRegistered() {
  const fontPath = path.resolve(process.cwd(), ASSETS.RESULT_FONT);
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: "Haettenschweiler" });
    } catch {
      // ignore duplicate registration
    }
  }
}

function drawCenteredText(ctx, text, x, y, size) {
  ctx.font = `${size}px Haettenschweiler`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(text), x, y);
}

async function generateResultBanner({ homeAvatarUrl, awayAvatarUrl, homeScore, awayScore }) {
  ensureFontRegistered();

  const basePath = path.resolve(process.cwd(), ASSETS.RESULT_BANNER);
  const baseImg = await loadImage(basePath);

  const canvas = createCanvas(1536, 1024);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImg, 0, 0, 1536, 1024);

  // Avatars (square)
  const homeAvatar = await loadImage(homeAvatarUrl);
  const awayAvatar = await loadImage(awayAvatarUrl);

  ctx.drawImage(homeAvatar,
    COORDS.homeImg.x1, COORDS.homeImg.y1,
    COORDS.homeImg.x2 - COORDS.homeImg.x1,
    COORDS.homeImg.y2 - COORDS.homeImg.y1
  );

  ctx.drawImage(awayAvatar,
    COORDS.awayImg.x1, COORDS.awayImg.y1,
    COORDS.awayImg.x2 - COORDS.awayImg.x1,
    COORDS.awayImg.y2 - COORDS.awayImg.y1
  );

  // Scores
  const size = (homeScore >= 10 || awayScore >= 10) ? 240 : 300;
  drawCenteredText(ctx, homeScore, COORDS.homeScore.cx, COORDS.homeScore.cy, size);
  drawCenteredText(ctx, awayScore, COORDS.awayScore.cx, COORDS.awayScore.cy, size);

  return canvas.toBuffer("image/png");
}

module.exports = { generateResultBanner };
