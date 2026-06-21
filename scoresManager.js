// نظام النقاط - أسبوعي + كلي
// يحفظ النقاط في ملف JSON محلي

const fs = require("fs");
const path = require("path");

const SCORES_FILE = path.join(__dirname, "scores.json");

function loadScores() {
  if (!fs.existsSync(SCORES_FILE)) {
    return { weekly: {}, total: {}, weekStart: getWeekStart() };
  }
  try {
    const data = JSON.parse(fs.readFileSync(SCORES_FILE, "utf8"));
    // تحقق إذا بدأت أسبوع جديد
    if (data.weekStart !== getWeekStart()) {
      data.weekly = {};
      data.weekStart = getWeekStart();
      saveScores(data);
    }
    return data;
  } catch {
    return { weekly: {}, total: {}, weekStart: getWeekStart() };
  }
}

function saveScores(data) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
}

function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day;
  const monday = new Date(now.setUTCDate(diff));
  return monday.toISOString().split("T")[0];
}

function addPoints(userId, username, points) {
  const data = loadScores();
  if (!data.weekly[userId]) data.weekly[userId] = { username, points: 0 };
  if (!data.total[userId]) data.total[userId] = { username, points: 0 };
  data.weekly[userId].points += points;
  data.weekly[userId].username = username;
  data.total[userId].points += points;
  data.total[userId].username = username;
  saveScores(data);
}

function getLeaderboard(type = "weekly", limit = 10) {
  const data = loadScores();
  const scores = data[type] || {};
  return Object.entries(scores)
    .map(([id, v]) => ({ id, username: v.username, points: v.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

module.exports = { addPoints, getLeaderboard };
