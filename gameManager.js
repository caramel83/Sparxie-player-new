// مدير حالة الألعاب النشطة بكل قناة
// يدعم نوعين من الحالة بنفس الوقت:
//   1) activeGames      -> اللعبة المفتوحة بالقناة (تلقائية أو يدوية بدون خصم محدد)
//   2) activeChallenges -> تحدي 1v1 (أو جماعي مفتوح المشاركة) لكل قناة
//
// كل لعبة مفتوحة معها مؤقت خمول (IDLE_TIMEOUT_MS): لو ما حد جاوب بهذي المدة،
// اللعبة تنغلق تلقائياً. كذلك، أي لعبة جديدة تبدأ بنفس القناة تقفل القديمة فوراً.

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 دقائق

const activeGames = new Map(); // channelId -> gameData (فيها idleTimer)
const activeChallenges = new Map(); // key: channelId -> challenge object

// onTimeout: دالة تُستدعى تلقائياً لو انتهت المهلة بدون أي إجابة
function setActiveGame(channelId, gameData, onTimeout) {
  // لو فيه لعبة سابقة بنفس القناة، نقفلها (نوقف مؤقتها) قبل ما نبدأ الجديدة
  clearActiveGame(channelId);

  if (onTimeout) {
    gameData.idleTimer = setTimeout(() => {
      // نتأكد إن نفس اللعبة لسا نشطة قبل ما ننفذ onTimeout (تجنب تعارض توقيت)
      if (activeGames.get(channelId) === gameData) {
        activeGames.delete(channelId);
        onTimeout();
      }
    }, IDLE_TIMEOUT_MS);
  }

  activeGames.set(channelId, gameData);
}

function getActiveGame(channelId) {
  return activeGames.get(channelId);
}

function clearActiveGame(channelId) {
  const existing = activeGames.get(channelId);
  if (existing && existing.idleTimer) clearTimeout(existing.idleTimer);
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
  IDLE_TIMEOUT_MS,
  setActiveGame,
  getActiveGame,
  clearActiveGame,
  setActiveChallenge,
  getActiveChallenge,
  clearActiveChallenge,
};
