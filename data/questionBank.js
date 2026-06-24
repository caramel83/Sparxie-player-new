// ============================================================
// data/questionBank.js — بنك الأسئلة الموحّد
// يجمع: أسئلة الثقافة العامة (trivia/battle/daily), أسئلة الصراحة (truth),
// أسئلة "تفضل كذا أو كذا" (wouldyourather), وأدوات توليد أسئلة HSR (عنصر/مسار/ندرة)
// ============================================================

const { CHARACTERS } = require("./characters");
const { randomFrom } = require("../utils");

// ---------- أسئلة ثقافية متعددة الخيارات (تُستخدم بـ trivia والتحدي الجماعي) ----------
const TRIVIA_QUESTIONS = [
  { q: "ما عاصمة اليابان؟", a: "طوكيو", choices: ["طوكيو", "أوساكا", "كيوتو", "ناغويا"] },
  { q: "كم عدد لاعبي كرة القدم لكل فريق؟", a: "11", choices: ["9", "10", "11", "12"] },
  { q: "من هو مخترع الهاتف؟", a: "غراهام بيل", choices: ["أديسون", "غراهام بيل", "تيسلا", "نيوتن"] },
  { q: "ما أكبر كوكب في المجموعة الشمسية؟", a: "المشتري", choices: ["زحل", "المشتري", "أورانوس", "نبتون"] },
  { q: "Sparxie تتبع أي Path في HSR؟", a: "Elation", choices: ["Harmony", "Elation", "Nihility", "Hunt"] },
  { q: "ما عنصر Sparxie في HSR؟", a: "Fire", choices: ["Ice", "Wind", "Fire", "Lightning"] },
  { q: "كم عدد قارات العالم؟", a: "7", choices: ["5", "6", "7", "8"] },
  { q: "ما أطول نهر في العالم؟", a: "النيل", choices: ["الأمازون", "النيل", "المسيسبي", "اليانغتسي"] },
  { q: "ما أسرع حيوان بري؟", a: "الفهد", choices: ["النمر", "الفهد", "الحصان", "الأسد"] },
  { q: "كم لون في قوس قزح؟", a: "7", choices: ["5", "6", "7", "8"] },
];

// ---------- أسئلة صراحة (truth) ----------
const TRUTH_QUESTIONS = [
  "ما أكثر شي تندم عليه في حياتك؟ CHAT يبي يعرف! 👀",
  "من أفضل شخص في السيرفر؟ قول بصراحة LIVE~ 😏",
  "كم ساعة تلعب ألعاب يومياً؟ الحقيقة! Sparxie تعرف 😂",
  "من تبي تبونكه الحين في السيرفر؟ 👀",
  "ما أغرب شي سويته وحدك؟ CHAT يبي يسمع! 🎭",
  "لو تقدر تحذف شخص من السيرفر من يكون؟ 👀",
  "ما أخجل موقف مررت فيه؟ STREAM EXCLUSIVE! 😱",
  "كم مرة سويت pity وما جاك الـ 5 star؟ 😭",
];

// ---------- أسئلة "تفضل كذا أو كذا" (wouldyourather) ----------
const WYR_QUESTIONS = [
  ["تكون Sparxie وتكون streamer مشهورة للأبد 📡", "تكون Sparkle وتعيش في المسرح للأبد 🎭"],
  ["تلعب HSR بدون pulls للأبد 😭", "تلعب بـ 5 star بس ما تختار 💀"],
  ["تنام 20 ساعة يومياً 😴", "ما تنام وتشاهد anime طول الليل 👀"],
  ["تعيش في Penacony وتحلم للأبد 🌙", "تعيش في Belobog وتتحمل البرد ❄️"],
  ["تكون Sparxhead وتشاهد كل stream 📺", "تكون content creator بدون fans 😢"],
  ["ما تقدر تقول لا لأحد أبداً 😰", "ما تقدر تقول نعم لأحد أبداً 😤"],
];

const ELEMENTS = ["Fire", "Ice", "Wind", "Lightning", "Quantum", "Imaginary", "Physical"];
const PATHS = [
  "Destruction", "Hunt", "Erudition", "Harmony", "Nihility",
  "Preservation", "Abundance", "Remembrance", "Elation",
];

// ---------- توليد سؤال "خمن الشخصية" متعدد الخيارات (4 أزرار) ----------
// يرجع: { question(embed fields), correctName, choices: [4 أسماء], character }
function generateGuessCharacterQuestion() {
  const character = randomFrom(CHARACTERS);
  const pool = CHARACTERS.filter((c) => c.name !== character.name);

  // نخلط ونسحب 3 مشتتات عشوائية 100%
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const distractors = shuffledPool.slice(0, 3).map((c) => c.name);

  const choices = [...distractors, character.name].sort(() => Math.random() - 0.5);

  return {
    character,
    correctName: character.name,
    choices,
  };
}

// ---------- توليد سؤال نعم/لا عن شخصية (الوضع القديم لا يزال متاح كنمط مستقل) ----------
const FEMALE_NAMES = [
  "Seele", "Silver Wolf", "Fu Xuan", "Jingliu", "Topaz & Numby", "Huohuo",
  "Ruan Mei", "Himeko", "Bronya", "Clara", "Bailu", "Black Swan", "Sparkle",
  "Acheron", "Robin", "Firefly", "Jade", "Yunli", "Lingsha", "Rappa", "Fugue",
  "Aglaea", "The Herta", "Tribbie", "Castorice", "Hyacine", "Cipher", "Cerydra",
  "Evernight", "Cyrene", "Kafka",
];

function generateYesNoCharacterQuestion() {
  const character = randomFrom(CHARACTERS);
  const questionTypes = ["gender", "rarity5", "element", "path"];
  const qType = randomFrom(questionTypes);

  let question, answer;
  if (qType === "gender") {
    const isFemale = FEMALE_NAMES.includes(character.name);
    question = `هل الشخصية **${character.name}** أنثى؟`;
    answer = isFemale ? "yes" : "no";
  } else if (qType === "rarity5") {
    question = `هل الشخصية **${character.name}** من ندرة ⭐⭐⭐⭐⭐ (5 نجوم)؟`;
    answer = character.rarity === 5 ? "yes" : "no";
  } else if (qType === "element") {
    const fakeEl = randomFrom(ELEMENTS.filter((e) => e !== character.element));
    const correctEl = character.element;
    const shown = Math.random() < 0.5 ? correctEl : fakeEl;
    answer = shown === correctEl ? "yes" : "no";
    question = `هل عنصر **${character.name}** هو ${shown}؟`;
  } else {
    const fakePath = randomFrom(PATHS.filter((p) => p !== character.path));
    const correctPath = character.path;
    const shown = Math.random() < 0.5 ? correctPath : fakePath;
    answer = shown === correctPath ? "yes" : "no";
    question = `هل مسار **${character.name}** هو ${shown}؟`;
  }

  return { question, answer, characterName: character.name };
}

// ---------- توليد سؤال "معلومة عن شخصية" متعدد الخيارات (للتحدي battle/daily) ----------
// النوع: element / path / rarity
function generateCharacterFactQuestion() {
  const character = randomFrom(CHARACTERS);
  const qTypes = ["element", "path", "rarity"];
  const qType = randomFrom(qTypes);

  let questionText, correctAnswer, choices;

  if (qType === "element") {
    correctAnswer = character.element;
    questionText = `ما عنصر **${character.name}**؟`;
    const distractors = ELEMENTS.filter((e) => e !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    choices = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
  } else if (qType === "path") {
    correctAnswer = character.path;
    questionText = `ما مسار **${character.name}**؟`;
    const distractors = PATHS.filter((p) => p !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    choices = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
  } else {
    correctAnswer = `${character.rarity}⭐`;
    questionText = `ما ندرة **${character.name}**؟`;
    const otherRarity = character.rarity === 5 ? "4⭐" : "5⭐";
    choices = [correctAnswer, otherRarity, "3⭐", "6⭐"].sort(() => Math.random() - 0.5);
    // نتجنب تكرار لو طلعت بالخطأ نفس القيمة
    choices = [...new Set(choices)];
    while (choices.length < 4) choices.push(`${Math.floor(Math.random() * 3) + 3}⭐`);
  }

  return { character, questionText, correctAnswer, choices, qType };
}

module.exports = {
  TRIVIA_QUESTIONS,
  TRUTH_QUESTIONS,
  WYR_QUESTIONS,
  ELEMENTS,
  PATHS,
  generateGuessCharacterQuestion,
  generateYesNoCharacterQuestion,
  generateCharacterFactQuestion,
};
