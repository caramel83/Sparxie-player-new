// مدير حالة الألعاب النشطة بكل قناة
const activeGames = new Map();

function setActiveGame(channelId, gameData) {
  activeGames.set(channelId, gameData);
}

function getActiveGame(channelId) {
  return activeGames.get(channelId);
}

function clearActiveGame(channelId) {
  activeGames.delete(channelId);
}

module.exports = { setActiveGame, getActiveGame, clearActiveGame };
