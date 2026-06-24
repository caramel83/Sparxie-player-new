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
} = require("./data/questionBank");
const { shuffleWord, randomFrom } = require("./utils");

const RED = 0xe03131;
const DEFAULT_ROUNDS = 5;

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
    default:
      throw new Error(`نمط لعبة غير معروف: ${mode}`);
  }
}

// ============== إطلاق لعبة مفتوحة (جماعية) بقناة ==============
async function launchOpenGame(channel, mode) {
  const gameId = generateGameId();
  const content = buildRoundContent(mode);

  setActiveGame(channel.id, {
    mode,
    gameId,
    answer: content.answer,
    choices: content.choices || null,
    characterName: content.characterName || null,
    points: content.points,
    wyrOptions: content.wyrOptions || null,
    wyrVotes: content.inputType === "wyr" ? { 1: 0, 2: 0 } : null,
    wyrVoted: content.inputType === "wyr" ? new Set() : null,
    inputType: content.inputType,
  });

  const embed = buildEmbed(content.embedData);
  let components;
  if (content.inputType === "yesno") components = [yesNoButtons(gameId)];
  else if (content.inputType === "choice") components = choiceButtons(gameId, content.choices);
  else if (content.inputType === "wyr") components = [wyrButtons(gameId), controlButtons(gameId)];
  else components = [controlButtons(gameId)];

  await channel.send({ embeds: [embed], components });
  return gameId;
}

// اختيار لعبة عشوائية من الأنماط القابلة للتشغيل التلقائي بالقناة
const AUTO_MODES = ["scramble", "hsr_guess", "guess_btn", "trivia"];
async function launchRandomOpenGame(channel) {
  const mode = randomFrom(AUTO_MODES);
  return launchOpenGame(channel, mode);
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

async function sendChallengeRound(channel, challenge) {
  const content = buildRoundContent(challenge.mode === "scramble" ? "scramble" : "quiz_battle");
  challenge.currentRound = content;
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

module.exports = {
  RED,
  DEFAULT_ROUNDS,
  generateGameId,
  controlButtons,
  yesNoButtons,
  choiceButtons,
  wyrButtons,
  buildEmbed,
  buildRoundContent,
  launchOpenGame,
  launchRandomOpenGame,
  AUTO_MODES,
  startChallenge,
  sendChallengeRound,
};
