// مدير حالة الألعاب النشطة بكل قناة
// يدعم نوعين من الحالة بنفس الوقت:
//   1) activeGames      -> اللعبة المفتوحة بالقناة (تلقائية أو يدوية بدون خصم محدد)
//   2) activeChallenges -> تحدي 1v1 (أو جماعي مفتوح المشاركة) لكل قناة

const activeGames = new Map();
const activeChallenges = new Map(); // key: channelId -> challenge object

function setActiveGame(channelId, gameData) {
  activeGames.set(channelId, gameData);
}

function getActiveGame(channelId) {
  return activeGames.get(channelId);
}

function clearActiveGame(channelId) {
  activeGames.delete(channelId);
}

function setActiveChallenge(channelId, challengeData) {
  activeChallenges.set(channelId, challengeData);
}

function getActiveChallenge(channelId) {
  return activeChallenges.get(channelId);
}

function clearActiveChallenge(channelId) {
  activeChallenges.delete(channelId);
}

module.exports = {
  setActiveGame,
  getActiveGame,
  clearActiveGame,
  setActiveChallenge,
  getActiveChallenge,
  clearActiveChallenge,
};
