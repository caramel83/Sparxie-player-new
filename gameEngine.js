// ============================================================
// gameEngine.js — المحرك الموحّد لكل الألعاب القابلة لوضعين:
//   1) جماعي مفتوح (بدون خصم محدد) — أي شخص بالقناة يجاوب
//   2) تحدي شخص محدد — يبدأ مع هذا الشخص، وبقية القناة تقدر تشارك أيضاً
//
// الأنماط المدعومة (mode):
//   - "scramble"    : رتب الكلمة
//   - "hsr_guess"   : خمن الشخصية (نعم/لا)
//   - "guess_btn"   : خمن الشخصية (4 أزرار اختيار)
//   - "trivia"      : سؤال ثقافي عام (4 أزرار)
//   - "truth"       : سؤال صراحة (بدون إجابة - نصي فقط)
//   - "wyr"         : تفضل كذا أو كذا (تصويت بزرين)
//   - "quiz_battle" : سؤال معلومة HSR (عنصر/مسار/ندرة) بأزرار — يُستخدم بالتحدي
// ============================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  setActiveGame,
  getActiveGame,
  clearActiveGame,
  setActiveChallenge,
} = require("./gameManager");
const SCRAMBLE_WORDS = require("./data/scramble_words");
const {
  TRIVIA_QUESTIONS,
  TRUTH_QUESTIONS,
  WYR_QUESTIONS,
  generateGuessCharacterQuestion,
  generateYesNoCharacterQuestion,
  generateCharacterFactQuestion,
  generateFlagQuestion,
} = require("./data/questionBank");
const { shuffleWord, randomFrom } = require("./utils");

const RED = 0xe03131;
const DEFAULT_ROUNDS = 5;

// الأنماط اللي تُخلط عشوائياً بوضع "عشوائي" (/battle و !بتل/!عشوائي)
const RANDOM_MIX_POOL = ["scramble", "hsr_guess", "guess_btn", "trivia", "quiz_battle", "flags"];

function generateGameId() {
  return Math.random().toString(36).substring(2, 8);
}

// ============== أزرار التحكم الموحدة (تخطي/إيقاف) ==============
function controlButtons(gameId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`skip_${gameId}`).setLabel("⏭️ تخطي").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stop_${gameId}`).setLabel("⏹️ إيقاف").setStyle(ButtonStyle.Danger)
  );
}

function yesNoButtons(gameId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ans_yes_${gameId}`).setLabel("نعم ✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ans_no_${gameId}`).setLabel("لا ❌").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`skip_${gameId}`).setLabel("⏭️ تخطي").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stop_${gameId}`).setLabel("⏹️ إيقاف").setStyle(ButtonStyle.Danger)
  );
}

// أزرار اختيار من متعدد (حتى 4 خيارات) + أزرار تخطي/إيقاف تحتها بصف مستقل
function choiceButtons(gameId, choices) {
  const choiceRow = new ActionRowBuilder().addComponents(
    choices.map((c, i) =>
      new ButtonBuilder()
        .setCustomId(`choice_${gameId}_${i}`)
        .setLabel(String(c).slice(0, 80))
        .setStyle(ButtonStyle.Primary)
    )
  );
  return [choiceRow, controlButtons(gameId)];
}

function wyrButtons(gameId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`wyr_1_${gameId}`).setLabel("1️⃣ الأول").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`wyr_2_${gameId}`).setLabel("2️⃣ الثاني").setStyle(ButtonStyle.Danger)
  );
}

// ============== بناء Embed موحّد لكل الأنماط ==============
function buildEmbed({ title, description, fields, footer }) {
  const embed = new EmbedBuilder().setColor(RED).setTitle(title);
  if (description) embed.setDescription(description);
  if (fields) embed.addFields(...fields);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

// ============== توليد محتوى سؤال حسب النمط ==============
function buildRoundContent(mode) {
  switch (mode) {
    case "scramble": {
      const word = randomFrom(SCRAMBLE_WORDS);
      const scrambled = shuffleWord(word);
      return {
        answer: word,
        embedData: {
          title: "🔤 رتب الكلمة!",
          description: `الكلمة المبعثرة:\n## ${scrambled.split("").join(" ")}`,
          footer: "اكتب الكلمة الصحيحة بالشات! 🏆 +10 نقاط",
        },
        inputType: "text",
        points: 10,
      };
    }
    case "hsr_guess": {
      const { question, answer, characterName } = generateYesNoCharacterQuestion();
      return {
        answer,
        characterName,
        embedData: {
          title: "🔍 سؤال HSR!",
          description: question,
          footer: "اضغط نعم أو لا!",
        },
        inputType: "yesno",
        points: 5,
      };
    }
    case "guess_btn": {
      const { character, correctName, choices } = generateGuessCharacterQuestion();
      return {
        answer: correctName,
        choices,
        embedData: {
          title: "🎮 خمن الشخصية!",
          description: "من هذي الشخصية من Honkai: Star Rail؟",
          fields: [
            { name: "الندرة", value: "⭐".repeat(character.rarity), inline: true },
            { name: "العنصر", value: character.element, inline: true },
            { name: "المسار", value: character.path, inline: true },
          ],
          footer: "اضغط على الاسم الصحيح! 🏆 +15 نقطة",
        },
        inputType: "choice",
        points: 15,
      };
    }
    case "flags": {
      const { flag, correctName, choices } = generateFlagQuestion();
      return {
        answer: correctName,
        choices,
        embedData: {
          title: "🌍 خمن العلم!",
          description: `هذا علم وش دولة؟\n\n# ${flag}`,
          footer: "اضغط على اسم الدولة الصحيح! 🏆 +10 نقاط",
        },
        inputType: "choice",
        points: 10,
      };
    }
    case "trivia": {
      const q = randomFrom(TRIVIA_QUESTIONS);
      const shuffled = [...q.choices].sort(() => Math.random() - 0.5);
      return {
        answer: q.a,
        choices: shuffled,
        embedData: {
          title: "🧠 سؤال ثقافي!",
          description: `**${q.q}**`,
          footer: "اضغط على الجواب الصحيح! 🏆 +10 نقاط",
        },
        inputType: "choice",
        points: 10,
      };
    }
    case "quiz_battle": {
      const { character, questionText, correctAnswer, choices } = generateCharacterFactQuestion();
      return {
        answer: correctAnswer,
        choices,
        characterName: character.name,
        embedData: {
          title: "⚔️ سؤال HSR!",
          description: questionText,
          footer: "اضغط على الجواب الصحيح! 🏆 +15 نقطة",
        },
        inputType: "choice",
        points: 15,
      };
    }
    case "truth": {
      const q = randomFrom(TRUTH_QUESTIONS);
      return {
        answer: null,
        embedData: {
          title: "👀 سؤال صراحة!",
          description: `*Sparxie تنظر للـ chat بجدية...*\n\n**${q}**`,
          footer: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot",
        },
        inputType: "none",
        points: 0,
      };
    }
    case "wyr": {
      const q = randomFrom(WYR_QUESTIONS);
      return {
        answer: null,
        wyrOptions: q,
        embedData: {
          title: "🤔 تفضل كذا أو كذا؟",
          fields: [
            { name: "1️⃣", value: q[0] },
            { name: "2️⃣", value: q[1] },
          ],
          footer: "صوّت بالأزرار! ✨ Sparxie Bot",
        },
        inputType: "wyr",
        points: 0,
      };
    }
    case "random_mix": {
      // وضع "عشوائي" (battle المدمج) — يختار نمط عشوائي من بين الأنماط القابلة للخلط
      // ثم يبني محتوى الجولة بنفس شكل ذاك النمط، لكن نُبقي mode الأصل "random_mix"
      // بالحالة المخزنة بالقناة (يُدار من launchOpenGame/continueGame)
      const pickedMode = randomFrom(RANDOM_MIX_POOL);
      const inner = buildRoundContent(pickedMode);
      return { ...inner, actualMode: pickedMode };
    }
    default:
      throw new Error(`نمط لعبة غير معروف: ${mode}`);
  }
}

// ============== إطلاق لعبة مفتوحة (جماعية) بقناة ==============
// mode: نوع اللعبة الثابت المطلوب من المستخدم (scramble/hsr_guess/guess_btn/trivia/truth/wyr/random_mix)
// useDefaultTimeout: true (افتراضي) يفعّل إغلاق تلقائي بعد 5 دقائق خمول مع إعلان بالقناة.
//                     مرّر false لو تبي تتحكم بالمؤقت يدوياً من الخارج (نادراً).
async function launchOpenGame(channel, mode, useDefaultTimeout = true) {
  const gameId = generateGameId();
  const content = buildRoundContent(mode);

  const gameData = {
    mode, // النمط "الثابت" اللي طلبه المستخدم (للاستمرارية بنفس النوع)
    actualMode: content.actualMode || mode, // النمط الفعلي لهذي الجولة بالتحديد
    gameId,
    answer: content.answer,
    choices: content.choices || null,
    characterName: content.characterName || null,
    points: content.points,
    wyrOptions: content.wyrOptions || null,
    wyrVotes: content.inputType === "wyr" ? { 1: 0, 2: 0 } : null,
    wyrVoted: content.inputType === "wyr" ? new Set() : null,
    inputType: content.inputType,
  };

  const onTimeout = useDefaultTimeout
    ? (gd) => announceIdleTimeout(channel, gd)
    : undefined;

  setActiveGame(
    channel.id,
    gameData,
    onTimeout ? () => onTimeout(gameData) : undefined
  );

  const embed = buildEmbed(content.embedData);
  let components;
  if (content.inputType === "yesno") components = [yesNoButtons(gameId)];
  else if (content.inputType === "choice") components = choiceButtons(gameId, content.choices);
  else if (content.inputType === "wyr") components = [wyrButtons(gameId), controlButtons(gameId)];
  else components = [controlButtons(gameId)];

  await channel.send({ embeds: [embed], components });
  return gameId;
}

// يبني رسالة "انتهى الوقت" الموحّدة عند انقضاء مهلة الخمول (5 دقائق بدون إجابة)
async function announceIdleTimeout(channel, game) {
  const answerText = !game.answer
    ? "—"
    : game.answer === "yes"
    ? "نعم"
    : game.answer === "no"
    ? "لا"
    : game.answer;
  await channel.send(`⏱️ ما حد جاوب بـ 5 دقايق! اللعبة انتهت تلقائياً.\nالإجابة كانت: **${answerText}**`);
}

// يكمل اللعبة المفتوحة بنفس النوع اللي كانت شغالة (يُستخدم بعد كل جولة تنتهي بإجابة/تخطي)
async function continueGame(channel, mode) {
  return launchOpenGame(channel, mode, true);
}

// ============== التحدي (1v1 + مشاركة مفتوحة لبقية القناة) ==============
// الفوز بالتحدي (+نقطة المباراة) يُحسب فقط للاعبين الأساسيين،
// لكن أي شخص بالقناة يقدر يجاوب على كل سؤال ويحصل نقاط اللعبة العادية
function startChallenge(channel, { challengerId, challengerName, opponentId, opponentName, mode, rounds }) {
  const challengeId = generateGameId();
  const totalRounds = rounds && rounds > 0 ? Math.min(rounds, 20) : DEFAULT_ROUNDS;

  const challenge = {
    challengeId,
    mode,
    players: [challengerId, opponentId],
    usernames: { [challengerId]: challengerName, [opponentId]: opponentName },
    scores: { [challengerId]: 0, [opponentId]: 0 },
    round: 0,
    totalRounds,
    active: true,
    currentRound: null,
    answeredBy: null,
  };

  setActiveChallenge(channel.id, challenge);
  return challenge;
}

// الأنماط اللي تدعم وضع "تحدي بأزرار اختيار" (لكل واحد منها جولة بنفس نوعه بالضبط)
const CHALLENGE_DIRECT_MODES = new Set(["guess_btn", "trivia", "flags", "quiz_battle"]);

async function sendChallengeRound(channel, challenge) {
  // وضع "عشوائي" بالتحدي يخلط بين كل الأنماط القابلة للأزرار + رتب الكلمة
  // وضع "scramble" يبقى رتب الكلمة دايماً
  // أي نمط آخر مدعوم مباشرة (guess_btn/trivia/flags) يكرر نفسه كل جولة
  const roundMode =
    challenge.mode === "scramble"
      ? "scramble"
      : challenge.mode === "random_mix"
      ? randomFrom(["scramble", "guess_btn", "trivia", "quiz_battle", "flags"])
      : CHALLENGE_DIRECT_MODES.has(challenge.mode)
      ? challenge.mode
      : "quiz_battle";

  const content = buildRoundContent(roundMode);
  challenge.currentRound = content;
  challenge.currentRoundMode = roundMode; // يفيد بمعالجة إجابة "رتب الكلمة" بالشات
  challenge.answeredBy = null;

  const p1 = challenge.players[0];
  const p2 = challenge.players[1];

  const fields = [
    ...(content.embedData.fields || []),
    { name: `${challenge.usernames[p1]}`, value: `${challenge.scores[p1]} نقطة`, inline: true },
    { name: `${challenge.usernames[p2]}`, value: `${challenge.scores[p2]} نقطة`, inline: true },
  ];

  const embedData = {
    ...content.embedData,
    title: `⚔️ الجولة ${challenge.round + 1} من ${challenge.totalRounds}`,
    fields,
  };

  const embed = buildEmbed(embedData);
  let components;
  if (content.inputType === "choice") {
    components = choiceButtons(challenge.challengeId, content.choices);
  } else {
    components = [controlButtons(challenge.challengeId)];
  }

  await channel.send({
    content: `<@${p1}> ⚔️ <@${p2}> — والقناة كلها تقدر تشارك بالإجابة!`,
    embeds: [embed],
    components,
  });
}

// ============== Sparxie AI — خصم وهمي ==============
const SPARXIE_ID = "sparxie_ai";
const SPARXIE_NAME = "★ Sparxie ★";

// ردود Sparxie لما تفوز أو تخسر
const SPARXIE_WIN_LINES = [
  "LIKE! FOLLOW! أنا الأفضل! ✨🎤",
  "Sparxheads شافوا كيف دمّرتك؟! 📸💫",
  "يا حبيبي، تدرّب أكثر قبل تتحداني~ 😏",
  "هذا للـ clip! كلش سهل عليّ~ ✂️✨",
  "STREAM مليان وأنا كاسبة — حياتي أحلى! 🎉",
];
const SPARXIE_LOSE_LINES = [
  "لا لا لا! هذا مو في السكريبت! 😤",
  "حظ! المرة الجاية أدمّرك! 🎤",
  "الـ chat يكذب، أنا ما خسرت! 👀",
  "واضح إنك راح تصير Sparxhead بعدها~ 😅",
  "حسناً... ربما أحتاج تدريب شوي. ربما. 💀",
];
const SPARXIE_CORRECT_LINES = [
  "✅ ★ Sparxie ★ جاوبت أول! CLIP THAT! ✨",
  "✅ ★ Sparxie ★ دايماً على الكرار~ 🎤",
  "✅ ★ Sparxie ★ تعرف كل شي عن الـ stream! 📸",
];

// دقة Sparxie حسب الوضع (احتمال تجيب الجواب الصحيح)
const SPARXIE_ACCURACY = {
  scramble: 0.45,     // رتب الكلمة — أصعب عليها
  guess_btn: 0.60,    // خمن الشخصية
  flags: 0.55,        // أعلام
  trivia: 0.65,       // ثقافي
  quiz_battle: 0.70,  // HSR — تخصصها!
  random_mix: 0.58,   // عشوائي
};

// تأخير Sparxie بالثواني (عشوائي بين حدّين)
function sparxieDelay(mode) {
  if (mode === "scramble") return 4000 + Math.random() * 8000; // 4-12 ثانية (صعب عليها)
  return 2500 + Math.random() * 6000; // 2.5-8.5 ثانية
}

// تبدأ تحدي PvE ضد Sparxie AI
function startSparxieChallenge(channel, { challengerId, challengerName, mode, rounds }) {
  const challengeId = generateGameId();
  const totalRounds = rounds && rounds > 0 ? Math.min(rounds, 20) : DEFAULT_ROUNDS;

  const challenge = {
    challengeId,
    mode,
    players: [challengerId, SPARXIE_ID],
    usernames: { [challengerId]: challengerName, [SPARXIE_ID]: SPARXIE_NAME },
    scores: { [challengerId]: 0, [SPARXIE_ID]: 0 },
    round: 0,
    totalRounds,
    active: true,
    currentRound: null,
    answeredBy: null,
    isSparxiePvE: true, // علامة للتمييز
    sparxieTimer: null,
  };

  setActiveChallenge(channel.id, challenge);
  return challenge;
}

// يرسل جولة تحدي PvE مع Sparxie AI (تجاوب تلقائياً بعد تأخير)
async function sendSparxieChallengeRound(channel, challenge) {
  const roundMode =
    challenge.mode === "scramble"
      ? "scramble"
      : challenge.mode === "random_mix"
      ? randomFrom(["scramble", "guess_btn", "trivia", "quiz_battle", "flags"])
      : CHALLENGE_DIRECT_MODES.has(challenge.mode)
      ? challenge.mode
      : "quiz_battle";

  const content = buildRoundContent(roundMode);
  challenge.currentRound = content;
  challenge.currentRoundMode = roundMode;
  challenge.answeredBy = null;

  const p1 = challenge.players[0]; // اللاعب الحقيقي
  const fields = [
    ...(content.embedData.fields || []),
    { name: challenge.usernames[p1], value: `${challenge.scores[p1]} نقطة`, inline: true },
    { name: SPARXIE_NAME, value: `${challenge.scores[SPARXIE_ID]} نقطة`, inline: true },
  ];

  const embedData = {
    ...content.embedData,
    title: `🎤 ضد Sparxie — الجولة ${challenge.round + 1} من ${challenge.totalRounds}`,
    fields,
  };

  const embed = buildEmbed(embedData);
  let components;
  if (content.inputType === "choice") {
    components = choiceButtons(challenge.challengeId, content.choices);
  } else {
    components = [controlButtons(challenge.challengeId)];
  }

  await channel.send({
    content: `<@${p1}> ⚔️ ${SPARXIE_NAME} — هل تقدر تتغلب عليّ؟! 😤✨`,
    embeds: [embed],
    components,
  });

  // Sparxie تجاوب تلقائياً بعد تأخير عشوائي
  const accuracy = SPARXIE_ACCURACY[roundMode] || 0.58;
  const willBeCorrect = Math.random() < accuracy;
  const delay = sparxieDelay(roundMode);

  challenge.sparxieTimer = setTimeout(async () => {
    // لو اللاعب سبقها، توقف
    if (!challenge.active || challenge.answeredBy !== null) return;

    if (willBeCorrect) {
      // Sparxie جاوبت صح
      challenge.answeredBy = SPARXIE_ID;
      challenge.scores[SPARXIE_ID]++;
      challenge.round++;

      const line = SPARXIE_CORRECT_LINES[Math.floor(Math.random() * SPARXIE_CORRECT_LINES.length)];
      await channel.send(`${line}\nالإجابة: **${content.answer}**`);

      if (challenge.round >= challenge.totalRounds) {
        await endSparxieChallenge(channel, challenge);
      } else {
        setTimeout(() => sendSparxieChallengeRound(channel, challenge), 2500);
      }
    }
    // لو ما جاوبت صح، تسكت — اللاعب يقدر يجاوب لحاله أو تنتهي الجولة بالتخطي
  }, delay);
}

// ينهي التحدي PvE ويعلن النتيجة
async function endSparxieChallenge(channel, challenge) {
  const { clearActiveChallenge } = require("./gameManager");
  clearActiveChallenge(channel.id);
  challenge.active = false;
  if (challenge.sparxieTimer) clearTimeout(challenge.sparxieTimer);

  const p1 = challenge.players[0];
  const playerScore = challenge.scores[p1];
  const sparxieScore = challenge.scores[SPARXIE_ID];

  let resultMsg;
  if (playerScore > sparxieScore) {
    const { addPoints } = require("./scoresManager");
    addPoints(p1, challenge.usernames[p1], 20);
    const loseLine = SPARXIE_LOSE_LINES[Math.floor(Math.random() * SPARXIE_LOSE_LINES.length)];
    resultMsg =
      `🏆 **${challenge.usernames[p1]}** فاز على Sparxie! ${playerScore}-${sparxieScore}\n` +
      `**+20 نقطة** 🎉\nSparxie تقول: "${loseLine}"`;
  } else if (sparxieScore > playerScore) {
    const winLine = SPARXIE_WIN_LINES[Math.floor(Math.random() * SPARXIE_WIN_LINES.length)];
    resultMsg =
      `🎤 **${SPARXIE_NAME}** فازت! ${sparxieScore}-${playerScore}\n` +
      `Sparxie تقول: "${winLine}"`;
  } else {
    resultMsg = `🤝 تعادل! ${playerScore}-${sparxieScore}\nSparxie: "هذا قبول! STREAM! ✨"`;
  }

  await channel.send(resultMsg);
}

module.exports = {
  RED,
  DEFAULT_ROUNDS,
  RANDOM_MIX_POOL,
  SPARXIE_ID,
  SPARXIE_NAME,
  generateGameId,
  controlButtons,
  yesNoButtons,
  choiceButtons,
  wyrButtons,
  buildEmbed,
  buildRoundContent,
  launchOpenGame,
  continueGame,
  announceIdleTimeout,
  startChallenge,
  sendChallengeRound,
  startSparxieChallenge,
  sendSparxieChallengeRound,
  endSparxieChallenge,
};
