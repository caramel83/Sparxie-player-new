// ============================================================
// prefixRouter.js — موجّه البريفكس العربي (!) لكل الأوامر
// يشتغل بس بالقنوات المحددة بـ GAME_CHANNEL_IDS (راجع config.js)
// يحوّل الرسالة النصية إلى استدعاء مباشر لمنطق نفس أمر السلاش،
// عبر بناء كائن "interaction" مبسّط يحاكي تفاعل الأمر الأصلي بقدر الإمكان،
// أو عبر استدعاء دوال gameEngine مباشرة للألعاب الجماعية/التحديات.
// ============================================================

const { isGameChannel } = require("./config");
const { launchOpenGame, startChallenge, sendChallengeRound } = require("./gameEngine");
const { getActiveChallenge } = require("./gameManager");

// كل بريفكس مرتبط بنمط لعبة من gameEngine (الألعاب الجماعية/التحدي)
// كل نمط يكرر نفسه بجولاته التالية (بدون تبديل عشوائي) إلا "بتل/عشوائي" المخصص للخلط
const GAME_PREFIX_MODES = {
  "رتب": "scramble",
  "خمن": "guess_btn",
  "علم": "flags",
  "ثقافي": "trivia",
  "صراحة": "truth",
  "تفضل": "wyr",
  "بتل": "random_mix", // وضع عشوائي يخلط بين كل الألعاب — يطابق /battle
  "عشوائي": "random_mix",
};

// أوامر السلاش العادية (بدون نمط لعبة) المرتبطة بـ command name لاستدعائها مباشرة
const SIMPLE_COMMAND_ALIASES = {
  "مساعدة": "help",
  "ترتيب": "leaderboard",
  "تقييم": "rate",
  "شيب": "ship",
  "حقيقة": "fact",
  "نكتة": "joke",
  "ضرب": "slap",
  "تصويب": "gunxie",
  "ميم": "meme",
  "حضن": "cuddle",
  "ربت": "pat",
  "بونك": "bonk",
  "ايتبول": "8ball",
  "طقس": "weather",
  "تذكير": "remind",
  "اقتباس": "quote",
  "اكسو": "xo",
  "خمسين": "duel",
};

const PREFIX = "!";

function parsePrefixCommand(content) {
  if (!content.startsWith(PREFIX)) return null;
  const stripped = content.slice(PREFIX.length).trim();
  if (!stripped) return null;
  const [word, ...rest] = stripped.split(/\s+/);
  return { word, rest, raw: stripped };
}

// يحاول يلقط منشن (خصم) من نص الرسالة
function extractMentionedUser(message) {
  const mentioned = message.mentions.users.first();
  if (!mentioned || mentioned.bot || mentioned.id === message.author.id) return null;
  return mentioned;
}

// يحاول يلقط رقم "جولات" من النص (مثال: !رتب @زيد 7)
function extractRounds(rest) {
  for (const token of rest) {
    const n = parseInt(token, 10);
    if (!isNaN(n) && n > 0 && n <= 20) return n;
  }
  return null;
}

// أنماط لا تدعم وضع "تحدي" لأنها بطبيعتها بدون صح/خطأ (صراحة، تفضيل)
const NO_CHALLENGE_MODES = new Set(["truth", "wyr"]);

async function handleGameModePrefix(message, mode) {
  const opponent = NO_CHALLENGE_MODES.has(mode) ? null : extractMentionedUser(message);

  if (!opponent) {
    await launchOpenGame(message.channel, mode);
    return;
  }

  if (getActiveChallenge(message.channelId)) {
    await message.reply("⚠️ فيه تحدي شغّال بهذي القناة بالفعل!");
    return;
  }

  const parsed = parsePrefixCommand(message.content);
  const rounds = extractRounds(parsed.rest);

  const challenge = startChallenge(message.channel, {
    challengerId: message.author.id,
    challengerName: message.author.username,
    opponentId: opponent.id,
    opponentName: opponent.username,
    mode: mode === "guess_btn" ? "quiz_battle" : mode,
    rounds,
  });

  await message.channel.send(
    `⚔️ <@${message.author.id}> يتحدى <@${opponent.id}>! والقناة كلها تقدر تشارك~`
  );
  setTimeout(() => sendChallengeRound(message.channel, challenge), 1500);
}

// ينشئ كائن interaction مبسّط يحاكي واجهة discord.js الأساسية المطلوبة
// من أوامر السلاش العادية (reply, options.getUser, options.getString, إلخ)
function buildFakeInteraction(message, rest) {
  // نحاول نربط أول/ثاني منشن كـ "target/hitter/shooter/person1/person2..."
  const mentionedUsers = [...message.mentions.users.values()].filter((u) => !u.bot);

  // أسماء الخيارات اللي تمثل "الشخص الثاني" بأوامر فيها منشنين (slap, gunxie, ship)
  const SECOND_USER_KEYS = new Set(["person2", "victim"]);

  // النص الخام بدون المنشنات (<@123>) وبدون رقم الجولات/الدقائق المُستخرج لاحقاً
  const textOnly = rest.filter((t) => !/^<@!?\d+>$/.test(t));
  const roundsValue = extractRounds(textOnly);
  // النص النهائي بدون الرقم المُستخدم كجولات/دقائق (لو موجود كآخر توكن)
  const textWithoutTrailingNumber =
    roundsValue !== null && textOnly[textOnly.length - 1] === String(roundsValue)
      ? textOnly.slice(0, -1)
      : textOnly;

  return {
    user: message.author,
    member: message.member,
    channel: message.channel,
    channelId: message.channelId,
    guild: message.guild,
    client: message.client,
    isCommand: () => true,
    options: {
      getUser: (name) => {
        if (mentionedUsers.length <= 1) return mentionedUsers[0] || null;
        // أمر بمنشنين (slap/gunxie/ship) -> ثاني منشن لـ victim/person2/target الثاني
        if (SECOND_USER_KEYS.has(name)) return mentionedUsers[1] || null;
        if (name === "target") {
          // gunxie يستخدم target كـ"المُصوَّب عليه" (الثاني) — slap يستخدم victim
          return mentionedUsers[1] || mentionedUsers[0] || null;
        }
        return mentionedUsers[0] || null;
      },
      getString: () => textWithoutTrailingNumber.join(" ") || null,
      getInteger: () => roundsValue,
    },
    deferReply: async () => message.channel.sendTyping().catch(() => {}),
    reply: async (payload) => {
      if (typeof payload === "string") return message.reply(payload);
      // نتجاهل ephemeral/flags لأنها رسالة عادية بالشات
      const { ephemeral, flags, ...rest } = payload;
      return message.reply(rest);
    },
    editReply: async (payload) => {
      if (typeof payload === "string") return message.channel.send(payload);
      const { ephemeral, flags, ...rest } = payload;
      return message.channel.send(rest);
    },
    followUp: async (payload) => {
      if (typeof payload === "string") return message.channel.send(payload);
      const { ephemeral, flags, ...rest } = payload;
      return message.channel.send(rest);
    },
  };
}

async function handlePrefixMessage(message, client) {
  if (!message.content.startsWith(PREFIX)) return false;
  if (!isGameChannel(message.channelId)) return false;

  const parsed = parsePrefixCommand(message.content);
  if (!parsed) return false;

  const { word, rest } = parsed;

  // 1) أوامر الألعاب (جماعي/تحدي)
  if (GAME_PREFIX_MODES[word]) {
    await handleGameModePrefix(message, GAME_PREFIX_MODES[word]);
    return true;
  }

  // 2) باقي الأوامر (سلاش عادي) عبر alias
  const commandName = SIMPLE_COMMAND_ALIASES[word];
  if (commandName && client.commands.has(commandName)) {
    const command = client.commands.get(commandName);
    const fakeInteraction = buildFakeInteraction(message, rest);
    try {
      await command.execute(fakeInteraction);
    } catch (err) {
      console.error("❌ خطأ بتنفيذ أمر البريفكس:", err);
      await message.reply("⚠️ حدث خطأ بتنفيذ الأمر.");
    }
    return true;
  }

  return false;
}

module.exports = { handlePrefixMessage, GAME_PREFIX_MODES, SIMPLE_COMMAND_ALIASES, PREFIX };
