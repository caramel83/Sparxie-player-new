// ============================================================
// dailyManager.js — نظام السؤال اليومي التلقائي
// ينبعت بقناة محددة (DAILY_CHANNEL_ID) بوقت محدد يومياً (DAILY_HOUR_UTC).
// سؤال اختيار من متعدد، يفضل مفتوح 24 ساعة، الكل يصوّت بالأزرار بصمت
// (بدون إعلان فوري). بعد انتهاء اليوم: يُقفل، يُعلن الجواب، توزّع النقاط
// بترتيب أول من جاوب صح (25/20/15/10/5...)، وينطلق سؤال جديد فوراً.
// ============================================================

const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { generateCharacterFactQuestion } = require("./data/questionBank");
const { addPoints } = require("./scoresManager");
const { RED } = require("./gameEngine");
const { DAILY_CHANNEL_ID, DAILY_HOUR_UTC } = require("./config");

const DAILY_FILE = path.join(__dirname, "daily_state.json");
const POINTS_LADDER = [25, 20, 15, 10]; // أول، ثاني، ثالث، رابع — وبعدها 5 ثابتة للباقي
const TRAILING_POINTS = 5;

function loadState() {
  if (!fs.existsSync(DAILY_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DAILY_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.writeFileSync(DAILY_FILE, JSON.stringify(state, null, 2));
}

function buildChoiceRow(gameId, choices) {
  return new ActionRowBuilder().addComponents(
    choices.map((c, i) =>
      new ButtonBuilder()
        .setCustomId(`daily_${gameId}_${i}`)
        .setLabel(String(c).slice(0, 80))
        .setStyle(ButtonStyle.Primary)
    )
  );
}

function generateDailyGameId() {
  return Math.random().toString(36).substring(2, 8);
}

// ============== نشر سؤال يومي جديد ==============
async function postNewDailyQuestion(client) {
  if (!DAILY_CHANNEL_ID) return;
  let channel;
  try {
    channel = await client.channels.fetch(DAILY_CHANNEL_ID);
  } catch {
    console.error("❌ DAILY_CHANNEL_ID غير صالح أو ما يقدر البوت يصل للقناة.");
    return;
  }
  if (!channel) return;

  const { character, questionText, correctAnswer, choices } = generateCharacterFactQuestion();
  const gameId = generateDailyGameId();

  const state = {
    gameId,
    question: questionText,
    answer: correctAnswer,
    choices,
    characterName: character.name,
    postedAt: Date.now(),
    answers: {}, // userId -> { username, choiceIndex, correct }
    correctOrder: [], // ترتيب اليوزر آيديز اللي جاوبوا صح بالترتيب الزمني
    channelId: channel.id,
    resolved: false,
  };
  saveState(state);

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle("🗓️ السؤال اليومي!")
    .setDescription(`${questionText}\n\nصوّت بالأزرار! النتيجة تُعلن بعد 24 ساعة 👀`)
    .setFooter({ text: "أول 4 يجاوبون صح ياخذون 25/20/15/10 نقطة، والباقي 5 نقاط ثابتة!" });

  await channel.send({ embeds: [embed], components: [buildChoiceRow(gameId, choices)] });
}

// ============== معالجة تصويت السؤال اليومي ==============
async function handleDailyVote(interaction) {
  const state = loadState();
  if (!state || state.resolved) {
    await interaction.reply({ content: "⚠️ السؤال اليومي مو نشط حالياً.", flags: 64 });
    return true;
  }

  const parts = interaction.customId.split("_");
  const gameId = parts[1];
  const choiceIdx = parseInt(parts[2], 10);

  if (state.gameId !== gameId) {
    await interaction.reply({ content: "⚠️ هذا السؤال اليومي انتهى بالفعل.", flags: 64 });
    return true;
  }

  const userId = interaction.user.id;
  if (state.answers[userId]) {
    await interaction.reply({ content: "✅ صوّتت بالفعل على السؤال اليومي! النتيجة تُعلن بعد 24 ساعة~", flags: 64 });
    return true;
  }

  const chosen = state.choices[choiceIdx];
  const isCorrect = chosen === state.answer;

  state.answers[userId] = {
    username: interaction.user.username,
    choiceIndex: choiceIdx,
    correct: isCorrect,
  };
  if (isCorrect) state.correctOrder.push(userId);
  saveState(state);

  await interaction.reply({
    content: "✅ تم تسجيل تصويتك! النتيجة تُعلن بعد 24 ساعة 👀",
    flags: 64,
  });
  return true;
}

// ============== إغلاق اليوم الحالي وتوزيع النقاط ==============
async function resolveDailyQuestion(client) {
  const state = loadState();
  if (!state || state.resolved) return;
  if (!DAILY_CHANNEL_ID) return;

  let channel;
  try {
    channel = await client.channels.fetch(state.channelId || DAILY_CHANNEL_ID);
  } catch {
    channel = null;
  }

  // توزيع النقاط بترتيب أول من جاوب صح
  state.correctOrder.forEach((userId, idx) => {
    const points = POINTS_LADDER[idx] !== undefined ? POINTS_LADDER[idx] : TRAILING_POINTS;
    const username = state.answers[userId]?.username || "عضو";
    addPoints(userId, username, points);
  });

  state.resolved = true;
  saveState(state);

  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🗓️ انتهى السؤال اليومي!")
      .setDescription(`**${state.question}**\n\n✅ الجواب الصحيح: **${state.answer}**`)
      .setFooter({ text: "تحقق من نقاطك بـ /leaderboard ✨" });

    await channel.send({ embeds: [embed] });
  }

  // إطلاق سؤال جديد فوراً
  await postNewDailyQuestion(client);
}

// ============== المجدول: يفحص كل دقيقة إذا حان وقت الإغلاق/البدء ==============
function startDailyScheduler(client) {
  if (!DAILY_CHANNEL_ID) {
    console.log("⚠️ DAILY_CHANNEL_ID غير محدد، السؤال اليومي معطّل.");
    return;
  }

  console.log(`🗓️ السؤال اليومي فعّال — ينشر/يُحسم كل يوم الساعة ${DAILY_HOUR_UTC}:00 UTC.`);

  setInterval(async () => {
    const state = loadState();

    // لو ما فيه سؤال نشط أصلاً، ابدأ أول سؤال فوراً
    if (!state) {
      await postNewDailyQuestion(client);
      return;
    }

    // لو فيه سؤال غير محسوم وعدّى 24 ساعة من نشره، اقفله ووزّع النقاط وابدأ سؤال جديد
    const hoursPassed = (Date.now() - state.postedAt) / (1000 * 60 * 60);
    if (!state.resolved && hoursPassed >= 24) {
      await resolveDailyQuestion(client);
    }
  }, 60 * 1000); // فحص كل دقيقة
}

module.exports = {
  startDailyScheduler,
  postNewDailyQuestion,
  resolveDailyQuestion,
  handleDailyVote,
};
