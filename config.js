// ============================================================
// config.js — الإعدادات المركزية المقروءة من متغيرات البيئة (.env)
// ============================================================

// قنوات الألعاب — البريفكس العربي (!) ما يشتغل إلا فيها
// تقدر تحدد أكثر من قناة مفصولة بفاصلة: "111,222,333"
const GAME_CHANNEL_IDS = (process.env.GAME_CHANNEL_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// قناة الألعاب التلقائية (الموجودة سابقاً)
const AUTO_GAME_CHANNEL_ID = process.env.AUTO_GAME_CHANNEL_ID || "";

// قناة الميمز التلقائية
const MEME_CHANNEL_ID = process.env.MEME_CHANNEL_ID || "";

// قناة السؤال اليومي (daily) — لازم تكون محددة عشان يشتغل الجدول التلقائي
const DAILY_CHANNEL_ID = process.env.DAILY_CHANNEL_ID || "";

// ساعة نشر السؤال اليومي الجديد (0-23) بتوقيت UTC. افتراضي: منتصف الليل
const DAILY_HOUR_UTC = parseInt(process.env.DAILY_HOUR_UTC || "0", 10);

// هل البريفكس العربي مفعّل بكل القنوات أو بس بالمحددة
function isGameChannel(channelId) {
  // لو ما حد حدد قنوات بالـ env، نشتغل بكل مكان (سلوك متسامح بدل تعطيل كامل)
  if (GAME_CHANNEL_IDS.length === 0) return true;
  return GAME_CHANNEL_IDS.includes(channelId);
}

module.exports = {
  GAME_CHANNEL_IDS,
  AUTO_GAME_CHANNEL_ID,
  MEME_CHANNEL_ID,
  DAILY_CHANNEL_ID,
  DAILY_HOUR_UTC,
  isGameChannel,
};
