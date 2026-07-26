require("dotenv").config();

// ===== Keep-alive server (يمنع Render من تنويم البوت) =====
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Sparxie is alive!"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Keep-alive server running"));

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const {
  getActiveGame,
  clearActiveGame,
  getActiveChallenge,
  clearActiveChallenge,
} = require("./gameManager");
const { addPoints } = require("./scoresManager");
const { normalizeArabic } = require("./utils");
const {
  continueGame,
  controlButtons,
  buildEmbed,
  sendChallengeRound,
  sendSparxieChallengeRound,
  endSparxieChallenge,
  RED,
} = require("./gameEngine");
const { MEME_CHANNEL_ID } = require("./config");
const { startDailyScheduler, handleDailyVote } = require("./dailyManager");
const { handlePrefixMessage } = require("./prefixRouter");
const akinatorCommand = require("./commands/akinator");

// تكمل نفس نوع اللعبة بعد انتهاء الجولة (كل لعبة مستقلة بقناتها).
// مهلة الخمول (5 دقائق) مفعّلة تلقائياً من جوّا launchOpenGame.
async function continueAfterRound(channel, mode) {
  return continueGame(channel, mode);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// تحميل الأوامر
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
const commandsForRegister = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandsForRegister.push(command.data.toJSON());
  }
}

const xoCommand = require("./commands/xo");

// ============== تسجيل الأوامر ==============
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commandsForRegister,
    });
    console.log("✅ تم تسجيل الأوامر بنجاح.");
  } catch (error) {
    console.error("❌ خطأ بتسجيل الأوامر:", error);
  }
}

// ============== عند الجاهزية ==============
client.once("ready", () => {
  console.log(`✅ سباركسي شغّال! تم تسجيل الدخول كـ ${client.user.tag}`);
  registerCommands();
  startAutoMemes();
  startDailyScheduler(client);
});

// ============== معالجة الأوامر والأزرار ==============
client.on("interactionCreate", async (interaction) => {
  // أوامر السلاش
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const msg = { content: "⚠️ حدث خطأ.", flags: 64 };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
      else await interaction.reply(msg);
    }
    return;
  }

  // الأزرار
  if (!interaction.isButton()) return;
  const id = interaction.customId;

  // ====== أزرار الأكيناتور ======
  if (id.startsWith("aki_")) {
    await akinatorCommand.handleButton(interaction);
    return;
  }

  // ====== أزرار السؤال اليومي ======
  if (id.startsWith("daily_")) {
    await handleDailyVote(interaction);
    return;
  }

  // ====== أزرار XO ======
  if (id.startsWith("xo_")) {
    await handleXoButton(interaction);
    return;
  }

  // ====== أزرار قبول/رفض التحدي (قديمة - متبقاة للتوافق، لو موجودة) ======
  if (id.startsWith("battle_accept_") || id.startsWith("battle_reject_")) {
    return interaction.reply({ content: "⚠️ هذا النوع من التحديات ابتدا فوراً بدون قبول/رفض الآن.", flags: 64 });
  }

  // ====== أزرار اختيار من متعدد (choice_) ======
  if (id.startsWith("choice_")) {
    await handleChoiceButton(interaction);
    return;
  }

  // ====== أزرار نعم/لا (ans_yes_/ans_no_) ======
  if (id.startsWith("ans_yes_") || id.startsWith("ans_no_")) {
    await handleYesNo(interaction);
    return;
  }

  // ====== أزرار تفضيل كذا أو كذا (wyr_) ======
  if (id.startsWith("wyr_1_") || id.startsWith("wyr_2_")) {
    await handleWyrVote(interaction);
    return;
  }

  // ====== تخطي / إيقاف الألعاب (مفتوحة أو تحدي) ======
  if (id.startsWith("skip_") || id.startsWith("stop_")) {
    await handleSkipStop(interaction);
    return;
  }
});

// ====== معالجة اختيار من متعدد (للعبة المفتوحة أو التحدي) ======
async function handleChoiceButton(interaction) {
  const parts = interaction.customId.split("_");
  const gameId = parts[1];
  const choiceIdx = parseInt(parts[2], 10);

  // أولاً: هل هذا تحدي نشط؟
  const challenge = getActiveChallenge(interaction.channelId);
  if (challenge && challenge.challengeId === gameId && challenge.currentRound) {
    return handleChallengeChoiceAnswer(interaction, challenge, choiceIdx);
  }

  // وإلا: لعبة مفتوحة عادية
  const game = getActiveGame(interaction.channelId);
  if (!game || game.gameId !== gameId || game.inputType !== "choice") {
    return interaction.reply({ content: "⚠️ هذه اللعبة انتهت أو غير نشطة.", flags: 64 });
  }

  const chosen = game.choices[choiceIdx];
  const correct = chosen === game.answer;
  clearActiveGame(interaction.channelId);

  if (correct) {
    addPoints(interaction.user.id, interaction.user.username, game.points);
    await interaction.update({
      content: `✅ **${interaction.user.username}** أجاب صح! **+${game.points} نقطة** 🎉\nالإجابة: **${game.answer}**`,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.update({
      content: `❌ إجابة خاطئة! اختار **${interaction.user.username}**: ${chosen}\nالصحيح كان: **${game.answer}**`,
      embeds: [],
      components: [],
    });
  }

  setTimeout(() => continueAfterRound(interaction.channel, game.mode), 3000);
}
async function handleChallengeChoiceAnswer(interaction, challenge, choiceIdx) {
  if (!challenge.players.includes(interaction.user.id)) {
    // أي شخص بالقناة يقدر يشارك بالإجابة، لكن لازم يكون عضو حقيقي (تحقق بسيط)
  }

  const round = challenge.currentRound;
  const chosen = round.choices[choiceIdx];
  const correct = chosen === round.answer;

  if (!correct) {
    return interaction.reply({ content: "❌ إجابة خاطئة! جرب مرة ثانية بالوقت المتبقي~", flags: 64 });
  }

  // أول إجابة صحيحة فقط تُحسب لهذي الجولة
  if (challenge.answeredBy) {
    return interaction.reply({ content: "⚠️ هذا السؤال انتهى بالفعل! انتظر الجولة الجاية~", flags: 64 });
  }

  challenge.answeredBy = interaction.user.id;
  challenge.answeredByName = interaction.user.username;

  await interaction.reply({ content: "✅ إجابة صحيحة! بانتظار كشف النتيجة بعد 3 ثواني~", flags: 64 });

  // نقاط اللعبة العادية تُحسب لأي شخص شارك وأجاب صح (مو بس اللاعبين الأساسيين)
  addPoints(interaction.user.id, interaction.user.username, round.points || 15);

  // فقط لو المجاوب أحد اللاعبين الأساسيين، تُحسب له نقطة بالتحدي (score)
  if (challenge.players.includes(interaction.user.id)) {
    challenge.scores[interaction.user.id]++;
  }

  setTimeout(async () => {
    await revealChallengeRound(interaction.channel, challenge);
  }, 3000);
}

async function revealChallengeRound(channel, challenge) {
  const round = challenge.currentRound;
  challenge.round++;

  // لو تحدي PvE، وقف مؤقت Sparxie لو لسه شغال
  if (challenge.isSparxiePvE && challenge.sparxieTimer) {
    clearTimeout(challenge.sparxieTimer);
    challenge.sparxieTimer = null;
  }

  const winnerText = challenge.answeredBy
    ? `✅ **${challenge.answeredByName}** أجاب صح أولاً! الإجابة: **${round.answer}**`
    : `⏱️ انتهى الوقت! الإجابة كانت: **${round.answer}**`;

  await channel.send(winnerText);

  if (challenge.round >= challenge.totalRounds) {
    // تحدي PvE — نستخدم endSparxieChallenge
    if (challenge.isSparxiePvE) {
      await endSparxieChallenge(channel, challenge);
      return;
    }

    // تحدي PvP — النهاية الاعتيادية
    const [p1, p2] = challenge.players;
    const s1 = challenge.scores[p1];
    const s2 = challenge.scores[p2];
    let resultMsg;
    if (s1 > s2) {
      addPoints(p1, challenge.usernames[p1], 20);
      resultMsg = `🏆 فاز **${challenge.usernames[p1]}** بالتحدي! ${s1}-${s2} — **+20 نقطة** 🎉`;
    } else if (s2 > s1) {
      addPoints(p2, challenge.usernames[p2], 20);
      resultMsg = `🏆 فاز **${challenge.usernames[p2]}** بالتحدي! ${s2}-${s1} — **+20 نقطة** 🎉`;
    } else {
      resultMsg = `🤝 تعادل بالتحدي! ${s1}-${s2}`;
    }
    clearActiveChallenge(channel.id);
    await channel.send(resultMsg);
  } else {
    // الجولة الجاية — PvE أو PvP
    if (challenge.isSparxiePvE) {
      setTimeout(() => sendSparxieChallengeRound(channel, challenge), 2000);
    } else {
      setTimeout(() => sendChallengeRound(channel, challenge), 2000);
    }
  }
}

// ====== معالجة نعم/لا (لعبة مفتوحة فقط) ======
async function handleYesNo(interaction) {
  const game = getActiveGame(interaction.channelId);
  if (!game || game.inputType !== "yesno") {
    return interaction.reply({ content: "⚠️ ما فيه لعبة نشطة!", flags: 64 });
  }

  const isYes = interaction.customId.startsWith("ans_yes_");
  const gameId = interaction.customId.split("_").pop();
  if (game.gameId !== gameId) return interaction.reply({ content: "⚠️ هذه اللعبة انتهت.", flags: 64 });

  const correct = (isYes && game.answer === "yes") || (!isYes && game.answer === "no");
  clearActiveGame(interaction.channelId);

  if (correct) {
    addPoints(interaction.user.id, interaction.user.username, game.points);
    await interaction.update({
      content: `✅ **${interaction.user.username}** أجاب صح! **+${game.points} نقاط** 🎉\nالإجابة: **${game.answer === "yes" ? "نعم" : "لا"}**`,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.update({
      content: `❌ إجابة خاطئة! الصح كان **${game.answer === "yes" ? "نعم" : "لا"}**`,
      embeds: [],
      components: [],
    });
  }

  setTimeout(() => continueAfterRound(interaction.channel, game.mode), 3000);
}

// ====== معالجة تصويت تفضيل كذا أو كذا ======
async function handleWyrVote(interaction) {
  const game = getActiveGame(interaction.channelId);
  if (!game || game.inputType !== "wyr") {
    return interaction.reply({ content: "⚠️ ما فيه تصويت نشط!", flags: 64 });
  }

  const choiceNum = interaction.customId.startsWith("wyr_1_") ? 1 : 2;
  const gameId = interaction.customId.split("_").pop();
  if (game.gameId !== gameId) return interaction.reply({ content: "⚠️ هذا التصويت انتهى.", flags: 64 });

  if (game.wyrVoted.has(interaction.user.id)) {
    return interaction.reply({ content: "صوّتت بالفعل! 😄", flags: 64 });
  }

  game.wyrVoted.add(interaction.user.id);
  game.wyrVotes[choiceNum]++;
  await interaction.reply({
    content: `اخترت **${choiceNum === 1 ? game.wyrOptions[0] : game.wyrOptions[1]}**! ✅`,
    flags: 64,
  });
}

// ====== معالجة التخطي والإيقاف (لعبة مفتوحة أو تحدي) ======
async function handleSkipStop(interaction) {
  const isStop = interaction.customId.startsWith("stop_");
  const gameId = interaction.customId.split("_").pop();

  // تحدي نشط؟
  const challenge = getActiveChallenge(interaction.channelId);
  if (challenge && challenge.challengeId === gameId) {
    clearActiveChallenge(interaction.channelId);
    if (isStop) {
      await interaction.update({ content: `⏹️ **${interaction.user.username}** أوقف التحدي.`, embeds: [], components: [] });
    } else {
      await interaction.update({ content: `⏭️ **${interaction.user.username}** تخطى! تم إيقاف التحدي.`, embeds: [], components: [] });
    }
    return;
  }

  // لعبة مفتوحة عادية
  const game = getActiveGame(interaction.channelId);
  if (!game) {
    return interaction.reply({ content: "⚠️ ما فيه لعبة نشطة!", flags: 64 });
  }

  clearActiveGame(interaction.channelId);

  const answerText = game.answer
    ? typeof game.answer === "string" && game.answer === "yes"
      ? "نعم"
      : game.answer === "no"
      ? "لا"
      : game.answer
    : "—";

  if (isStop) {
    await interaction.update({
      content: `⏹️ **${interaction.user.username}** أوقف اللعبة.\nالإجابة كانت: **${answerText}**`,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.update({
      content: `⏭️ **${interaction.user.username}** تخطى! الإجابة كانت: **${answerText}**`,
      embeds: [],
      components: [],
    });
    setTimeout(() => continueAfterRound(interaction.channel, game.mode), 2000);
  }
}

// ====== معالجة رسائل الشات (تخمين نصي + رتب كلمة + تحدي scramble + بريفكس عربي) ======
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ====== أوامر البريفكس العربي (!) ======
  const handled = await handlePrefixMessage(message, client);
  if (handled) return;

  // ====== معالجة تحدي "رتب الكلمة" (إجابة نصية) ======
  // نتحقق من نمط الجولة الفعلي (currentRoundMode) عشان وضع "عشوائي" يدعم جولات رتب الكلمة كذلك
  const challenge = getActiveChallenge(message.channelId);
  if (challenge && challenge.currentRoundMode === "scramble" && challenge.currentRound && !challenge.answeredBy) {
    const guess = message.content.trim();
    const correctAnswer = challenge.currentRound.answer;

    if (normalizeArabic(guess) === normalizeArabic(correctAnswer)) {
      challenge.answeredBy = message.author.id;
      challenge.answeredByName = message.author.username;

      addPoints(message.author.id, message.author.username, challenge.currentRound.points || 10);
      if (challenge.players.includes(message.author.id)) {
        challenge.scores[message.author.id]++;
      }

      await message.reply(`✅ إجابة صحيحة! بانتظار كشف النتيجة بعد 3 ثواني~`);

      setTimeout(async () => {
        await revealChallengeRound(message.channel, challenge);
      }, 3000);
      return;
    }
  }

  // ====== معالجة الألعاب المفتوحة العادية (رتب الكلمة بدون تحدي) ======
  const activeGame = getActiveGame(message.channelId);
  if (!activeGame || activeGame.inputType !== "text") return;

  const guess = message.content.trim();

  if (activeGame.mode === "scramble") {
    if (normalizeArabic(guess) === normalizeArabic(activeGame.answer)) {
      clearActiveGame(message.channelId);
      addPoints(message.author.id, message.author.username, activeGame.points);
      await message.reply(`🎉 **${message.author.username}** رتّب الكلمة! الإجابة: **${activeGame.answer}** — **+${activeGame.points} نقاط** 🏆`);
      setTimeout(() => continueAfterRound(message.channel, activeGame.mode), 3000);
    }
  }
});

// ============== XO ==============
async function handleXoButton(interaction) {
  const [, gameId, idxStr] = interaction.customId.split("_");
  const idx = parseInt(idxStr, 10);
  const game = xoCommand.xoGames.get(gameId);

  if (!game) {
    return interaction.reply({ content: "⚠️ هذي اللعبة خلصت.", flags: 64 });
  }
  if (interaction.user.id !== game.players[game.turn]) {
    return interaction.reply({ content: "⚠️ مو دورك!", flags: 64 });
  }
  if (game.board[idx] !== null) {
    return interaction.reply({ content: "⚠️ هذا المكان محجوز!", flags: 64 });
  }

  game.board[idx] = game.turn;
  const winner = xoCommand.checkWinner(game.board);

  if (winner) {
    xoCommand.xoGames.delete(gameId);
    const resultText = winner === "draw" ? "🤝 **تعادل!**" : `🎉 **فاز <@${game.players[winner]}>!**`;
    if (winner !== "draw") addPoints(game.players[winner], "", 10);
    const embed = new EmbedBuilder().setColor(winner === "draw" ? 0x95a5a6 : RED).setTitle("❌⭕ انتهت اللعبة!").setDescription(resultText);
    await interaction.update({ embeds: [embed], components: xoCommand.buildBoard(game.board, gameId, true) });
    return;
  }

  game.turn = game.turn === "X" ? "O" : "X";
  const embed = new EmbedBuilder().setColor(RED).setTitle("❌⭕ إكس أو").setDescription(`دور: <@${game.players[game.turn]}> (${game.turn})`);
  await interaction.update({ embeds: [embed], components: xoCommand.buildBoard(game.board, gameId) });
}

// ============== أوتو-بوست ميمات ==============
const { fetchMeme, CAPTIONS } = require("./commands/meme");

function startAutoMemes() {
  if (!MEME_CHANNEL_ID) {
    console.log("⚠️ MEME_CHANNEL_ID غير محدد، أوتو-ميم متوقف.");
    return;
  }
  console.log("🎭 أوتو-بوست ميمات فعّال كل ساعة.");
  setInterval(async () => {
    try {
      const channel = await client.channels.fetch(MEME_CHANNEL_ID);
      if (!channel) return;
      const url = await fetchMeme();
      if (!url) return;
      const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(caption)
        .setImage(url)
        .setFooter({ text: "✨ Sparxie Bot • Honkai: Star Rail" });
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("❌ خطأ أوتو-ميم:", err);
    }
  }, 60 * 60 * 1000);
}

client.login(process.env.DISCORD_TOKEN);
