// commands/akinator.js — أكيناتور HSR
// البوت يختار شخصية سراً ويسأل أسئلة نعم/لا لتضييق الاحتمالات حتى يخمن

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { RED } = require("../gameEngine");
const { addPoints } = require("../scoresManager");

// ====== قائمة الشخصيات الذكور ======
const MALE_NAMES = new Set([
  "Welt", "Gepard", "Yanqing", "Luocha", "Blade",
  "Jing Yuan", "Dr. Ratio", "Argenti",
  "Dan Heng - Imbibitor Lunae", "Dan Heng",
  "Boothill", "Rappa", "Mydei", "Phainon",
  "March 7th", // استثناء (اسمها يوحي لكنها أنثى — مش موجودة هنا)
  "Trailblazer", // يعتمد على اختيار اللاعب — نعدّه ذكر هنا
]);

// ====== قائمة الأسئلة بالترتيب ======
// كل سؤال: نص السؤال + دالة تعطي true/false لشخصية معطاة
const QUESTIONS = [
  {
    text: "هل الشخصية أنثى؟",
    fn: (c) => !MALE_NAMES.has(c.name),
  },
  {
    text: "هل ندرتها ⭐⭐⭐⭐⭐ (5 نجوم)؟",
    fn: (c) => c.rarity === 5,
  },
  {
    text: "هل عنصرها **Fire** 🔥؟",
    fn: (c) => c.element === "Fire",
  },
  {
    text: "هل عنصرها **Ice** ❄️؟",
    fn: (c) => c.element === "Ice",
  },
  {
    text: "هل عنصرها **Lightning** ⚡؟",
    fn: (c) => c.element === "Lightning",
  },
  {
    text: "هل عنصرها **Wind** 💨؟",
    fn: (c) => c.element === "Wind",
  },
  {
    text: "هل عنصرها **Quantum** 💜؟",
    fn: (c) => c.element === "Quantum",
  },
  {
    text: "هل عنصرها **Imaginary** 🟡؟",
    fn: (c) => c.element === "Imaginary",
  },
  {
    text: "هل عنصرها **Physical** ⚪؟",
    fn: (c) => c.element === "Physical",
  },
  {
    text: "هل مسارها **Destruction** ⚔️؟",
    fn: (c) => c.path === "Destruction",
  },
  {
    text: "هل مسارها **Hunt** 🏹؟",
    fn: (c) => c.path === "Hunt",
  },
  {
    text: "هل مسارها **Erudition** 📚؟",
    fn: (c) => c.path === "Erudition",
  },
  {
    text: "هل مسارها **Harmony** 🎵؟",
    fn: (c) => c.path === "Harmony",
  },
  {
    text: "هل مسارها **Nihility** 🌑؟",
    fn: (c) => c.path === "Nihility",
  },
  {
    text: "هل مسارها **Preservation** 🛡️؟",
    fn: (c) => c.path === "Preservation",
  },
  {
    text: "هل مسارها **Abundance** 🌿؟",
    fn: (c) => c.path === "Abundance",
  },
  {
    text: "هل مسارها **Remembrance** 🧠؟",
    fn: (c) => c.path === "Remembrance",
  },
];

// جلسات الأكيناتور النشطة — key: channelId
const akinatorSessions = new Map();

// اختار أفضل سؤال تالي (الأكثر تمييزاً — يقسم الاحتمالات أقرب لـ 50/50)
function pickBestQuestion(pool, askedIndices) {
  let bestIdx = -1;
  let bestScore = Infinity;

  for (let i = 0; i < QUESTIONS.length; i++) {
    if (askedIndices.has(i)) continue;
    const trueCount = pool.filter(QUESTIONS[i].fn).length;
    const falseCount = pool.length - trueCount;
    // أفضل سؤال هو الأقرب للتقسيم المتوازي (50/50)
    const score = Math.abs(trueCount - falseCount);
    if (trueCount > 0 && falseCount > 0 && score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // لو ما فيه سؤال يقسم، خذ أول سؤال ما اتسأل
  if (bestIdx === -1) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (!askedIndices.has(i)) return i;
    }
  }
  return bestIdx;
}

// بناء embed السؤال
function buildQuestionEmbed(session) {
  const q = QUESTIONS[session.currentQuestionIdx];
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle("🔮 أكيناتور HSR!")
    .setDescription(
      `*Sparxie تفكر بعمق...*\n\n**السؤال ${session.questionCount + 1}:**\n\n## ${q.text}`
    )
    .addFields({
      name: "الاحتمالات المتبقية",
      value: `**${session.pool.length}** شخصية`,
      inline: true,
    })
    .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie تخمن شخصيتك~" });
}

// أزرار نعم/لا + توقف
function buildButtons(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aki_yes_${sessionId}`)
      .setLabel("✅ نعم")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`aki_no_${sessionId}`)
      .setLabel("❌ لا")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`aki_stop_${sessionId}`)
      .setLabel("🚫 توقف")
      .setStyle(ButtonStyle.Secondary)
  );
}

// أزرار تأكيد التخمين (صح/غلط)
function buildGuessButtons(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aki_correct_${sessionId}`)
      .setLabel("✅ صح!")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`aki_wrong_${sessionId}`)
      .setLabel("❌ غلط")
      .setStyle(ButtonStyle.Danger)
  );
}

// يحاول يخمن الشخصية الأكثر ترجيحاً
function makeGuess(pool) {
  // لو شخصية وحدة — خمّنها
  if (pool.length === 1) return pool[0];
  // لو أكثر — خذ الأولى (بعد الفلترة تكون الأقرب)
  return pool[0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("akinator")
    .setDescription("فكر بشخصية HSR وSparxie تخمنها! 🔮"),

  akinatorSessions,

  async execute(interaction) {
    // لو فيه جلسة نشطة بالقناة
    if (akinatorSessions.has(interaction.channelId)) {
      return interaction.reply({
        content: "⚠️ فيه لعبة أكيناتور شغالة بالقناة! انتظر تنتهي أو اضغط توقف.",
        ephemeral: true,
      });
    }

    const sessionId = Math.random().toString(36).substring(2, 8);
    const pool = [...CHARACTERS]; // كل الشخصيات متاحة في البداية
    const firstQIdx = pickBestQuestion(pool, new Set());

    const session = {
      sessionId,
      userId: interaction.user.id,
      username: interaction.user.username,
      pool,
      askedIndices: new Set([firstQIdx]),
      currentQuestionIdx: firstQIdx,
      questionCount: 0,
      guessAttempts: 0,
      maxGuesses: 3,
    };

    akinatorSessions.set(interaction.channelId, session);

    const embed = buildQuestionEmbed(session);
    await interaction.reply({
      content: `🔮 **${interaction.user.username}** فكّر بشخصية HSR وSparxie راح تخمنها~ ✨`,
      embeds: [embed],
      components: [buildButtons(sessionId)],
    });
  },

  // معالجة أزرار الأكيناتور (تستدعى من index.js)
  async handleButton(interaction) {
    const id = interaction.customId;
    const channelSession = akinatorSessions.get(interaction.channelId);

    if (!channelSession) {
      return interaction.reply({ content: "⚠️ ما فيه لعبة أكيناتور نشطة!", ephemeral: true });
    }

    const sessionId = id.split("_").slice(2).join("_");
    if (channelSession.sessionId !== sessionId) {
      return interaction.reply({ content: "⚠️ هذه الجلسة انتهت.", ephemeral: true });
    }

    const session = channelSession;

    // ====== توقف ======
    if (id.startsWith("aki_stop_")) {
      akinatorSessions.delete(interaction.channelId);
      return interaction.update({
        content: `🚫 **${interaction.user.username}** أوقف الأكيناتور!\nSparxie: "حسناً... اللايف ينتهي أحياناً~ 😤✨"`,
        embeds: [],
        components: [],
      });
    }

    // ====== اللاعب أكد التخمين صح ======
    if (id.startsWith("aki_correct_")) {
      akinatorSessions.delete(interaction.channelId);
      addPoints(session.userId, session.username, 10);
      return interaction.update({
        content:
          `🎉 **Sparxie خمنت صح!** CLIP THAT! ✨📸\n` +
          `**${session.username}** فكّر بـ **${makeGuess(session.pool).name}**\n` +
          `**+10 نقاط** لـ Sparxie~ اشتركوا بالقناة! 🎤`,
        embeds: [],
        components: [],
      });
    }

    // ====== اللاعب قال التخمين غلط ======
    if (id.startsWith("aki_wrong_")) {
      session.guessAttempts++;
      session.pool = session.pool.filter((c) => c.name !== makeGuess(session.pool).name);

      // لو ما في شخصيات ثانية أو وصلنا للحد الأقصى
      if (session.pool.length === 0 || session.guessAttempts >= session.maxGuesses) {
        akinatorSessions.delete(interaction.channelId);
        return interaction.update({
          content:
            `😤 Sparxie استسلمت! كسبت عليها!\n` +
            `Sparxie: "هذا مو في السكريبت!! سأضيف هذه الشخصية لقاعدة بياناتي... قريباً~ 💀✨"\n` +
            `**+5 نقاط** لك على التغلب على Sparxie! 🏆`,
          embeds: [],
          components: [],
        });
      }

      // تابع الأسئلة بعد الرفض
      return await continueSession(interaction, session);
    }

    // ====== نعم أو لا ======
    const isYes = id.startsWith("aki_yes_");
    const q = QUESTIONS[session.currentQuestionIdx];

    // فلتر الشخصيات بناءً على الإجابة
    session.pool = session.pool.filter((c) => (isYes ? q.fn(c) : !q.fn(c)));
    session.questionCount++;

    // لو الاحتمالات صفر — خطأ منطقي، reset
    if (session.pool.length === 0) {
      akinatorSessions.delete(interaction.channelId);
      return interaction.update({
        content: "😵 Sparxie ارتبكت! ما في شخصية تطابق إجاباتك. جرب مرة ثانية~",
        embeds: [],
        components: [],
      });
    }

    await continueSession(interaction, session);
  },
};

// تكمل الجلسة — إما تسأل سؤال جديد أو تخمن
async function continueSession(interaction, session) {
  // شرط التخمين: شخصية وحدة، أو 10 أسئلة، أو ما في سؤال جديد مفيد
  const shouldGuess =
    session.pool.length === 1 ||
    session.questionCount >= 10 ||
    session.askedIndices.size >= QUESTIONS.length;

  if (shouldGuess) {
    const guess = makeGuess(session.pool);
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🔮 Sparxie خمّنت!")
      .setDescription(
        `*Sparxie تنظر للكاميرا بثقة...*\n\n` +
        `## هل أنت تفكر بـ...\n# ${guess.name}؟\n\n` +
        `العنصر: **${guess.element}** | المسار: **${guess.path}** | الندرة: ${"⭐".repeat(guess.rarity)}`
      )
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie تعرف كل شي~" });

    return interaction.update({
      embeds: [embed],
      components: [buildGuessButtons(session.sessionId)],
    });
  }

  // سؤال جديد
  const nextIdx = pickBestQuestion(session.pool, session.askedIndices);
  if (nextIdx === -1) {
    // ما في سؤال جديد — خمن
    const guess = makeGuess(session.pool);
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🔮 Sparxie خمّنت!")
      .setDescription(`## هل أنت تفكر بـ...\n# ${guess.name}؟`)
      .setFooter({ text: "✨ Sparxie Bot" });
    return interaction.update({
      embeds: [embed],
      components: [buildGuessButtons(session.sessionId)],
    });
  }

  session.askedIndices.add(nextIdx);
  session.currentQuestionIdx = nextIdx;

  const embed = buildQuestionEmbed(session);
  await interaction.update({
    embeds: [embed],
    components: [buildButtons(session.sessionId)],
  });
}
