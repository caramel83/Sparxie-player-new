require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const { getActiveGame, clearActiveGame } = require("./gameManager");
const { addPoints } = require("./scoresManager");
const { normalizeArabic } = require("./utils");
const {
  launchRandom,
  launchHSRGuess,
  launchScramble,
  launchGuess,
  RED,
} = require("./gameLauncher");

// ============== إعدادات ==============
const AUTO_GAME_INTERVAL_MS = 60 * 60 * 1000; // كل ساعة
const AUTO_GAME_CHANNEL_ID = process.env.AUTO_GAME_CHANNEL_ID;
// =====================================

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
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
const commandsForRegister = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandsForRegister.push(command.data.toJSON());
  }
}

const xoCommand = require("./commands/xo");
const battleCommand = require("./commands/battle");
const { sendBattleQuestion } = require("./commands/battle");

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
  startAutoGames();
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

  // ====== أزرار XO ======
  if (id.startsWith("xo_")) {
    await handleXoButton(interaction);
    return;
  }

  // ====== أزرار البتل ======
  if (id.startsWith("battle_accept_") || id.startsWith("battle_reject_")) {
    await handleBattleAccept(interaction);
    return;
  }

  // ====== تخطي / إيقاف الألعاب ======
  if (id.startsWith("skip_") || id.startsWith("stop_")) {
    await handleSkipStop(interaction);
    return;
  }

  // ====== أزرار نعم/لا للـ guess_yesno ======
  if (id.startsWith("ans_yes_") || id.startsWith("ans_no_")) {
    await handleYesNo(interaction);
    return;
  }
});

// ====== معالجة نعم/لا ======
async function handleYesNo(interaction) {
  const game = getActiveGame(interaction.channelId);
  if (!game || game.type !== "guess_yesno") {
    return interaction.reply({ content: "⚠️ ما فيه لعبة نشطة!", flags: 64 });
  }

  const isYes = interaction.customId.startsWith("ans_yes_");
  const gameId = interaction.customId.split("_").pop();
  if (game.gameId !== gameId) return interaction.reply({ content: "⚠️ هذه اللعبة انتهت.", flags: 64 });

  const correct = (isYes && game.answer === "yes") || (!isYes && game.answer === "no");
  clearActiveGame(interaction.channelId);

  if (correct) {
    addPoints(interaction.user.id, interaction.user.username, 5);
    await interaction.update({
      content: `✅ **${interaction.user.username}** أجاب صح! **+5 نقاط** 🎉\nالإجابة: **${game.answer === "yes" ? "نعم" : "لا"}**`,
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

  // تشغيل اللعبة التالية تلقائياً بعد 3 ثواني
  setTimeout(() => launchRandom(interaction.channel), 3000);
}

// ====== معالجة التخطي والإيقاف ======
async function handleSkipStop(interaction) {
  const game = getActiveGame(interaction.channelId);
  const isStop = interaction.customId.startsWith("stop_");

  if (!game) {
    return interaction.reply({ content: "⚠️ ما فيه لعبة نشطة!", flags: 64 });
  }

  clearActiveGame(interaction.channelId);

  if (isStop) {
    await interaction.update({
      content: `⏹️ **${interaction.user.username}** أوقف اللعبة.\nالإجابة كانت: **${game.answer || "—"}**`,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.update({
      content: `⏭️ **${interaction.user.username}** تخطى! الإجابة كانت: **${game.answer || "—"}**`,
      embeds: [],
      components: [],
    });
    // ابدأ لعبة جديدة فوراً
    setTimeout(() => launchRandom(interaction.channel), 2000);
  }
}

// ====== معالجة قبول/رفض البتل ======
async function handleBattleAccept(interaction) {
  const parts = interaction.customId.split("_");
  const action = parts[1]; // accept أو reject
  const battleId = parts[2];
  const battle = battleCommand.battles.get(battleId);

  if (!battle) {
    return interaction.reply({ content: "⚠️ هذا التحدي انتهى.", flags: 64 });
  }

  if (interaction.user.id !== battle.players[1]) {
    return interaction.reply({ content: "⚠️ هذا التحدي مش لك!", flags: 64 });
  }

  if (action === "reject") {
    battleCommand.battles.delete(battleId);
    await interaction.update({ content: `❌ **${interaction.user.username}** رفض التحدي.`, embeds: [], components: [] });
    return;
  }

  // قبول — ابدأ اللعبة
  await interaction.update({ content: "⚔️ بدأ التحدي! استعدوا...", embeds: [], components: [] });
  battle.round = 0;
  setTimeout(() => sendBattleQuestion(interaction.channel, battleId, battle), 1500);
}

// ====== معالجة رسائل الشات (تخمين + رتب كلمة + بتل) ======
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ====== معالجة البتل ======
  for (const [battleId, battle] of battleCommand.battles) {
    if (!battle.active || !battle.currentQuestion) continue;

    const playerIds = battle.players;
    if (!playerIds.includes(message.author.id)) continue;
    if (battle.answered?.has(message.author.id)) continue;

    const guess = message.content.trim().toLowerCase();
    const correct = battle.currentQuestion.answer.toLowerCase();

    if (guess === correct || normalizeArabic(guess) === normalizeArabic(correct)) {
      battle.answered.add(message.author.id);
      battle.scores[message.author.id]++;
      battle.round++;

      await message.reply(`✅ **${message.author.username}** أجاب صح! الإجابة: **${battle.currentQuestion.answer}**`);

      if (battle.round >= battle.maxRounds) {
        // نهاية المباراة
        const [p1, p2] = battle.players;
        const s1 = battle.scores[p1];
        const s2 = battle.scores[p2];
        let resultMsg;
        if (s1 > s2) {
          addPoints(p1, battle.usernames[p1], 20);
          resultMsg = `🏆 فاز **${battle.usernames[p1]}** ${s1}-${s2}! **+20 نقطة**`;
        } else if (s2 > s1) {
          addPoints(p2, battle.usernames[p2], 20);
          resultMsg = `🏆 فاز **${battle.usernames[p2]}** ${s2}-${s1}! **+20 نقطة**`;
        } else {
          resultMsg = `🤝 تعادل! ${s1}-${s2}`;
        }
        battleCommand.battles.delete(battleId);
        await message.channel.send(resultMsg);
      } else {
        setTimeout(() => sendBattleQuestion(message.channel, battleId, battle), 2000);
      }
      return;
    }
  }

  // ====== معالجة الألعاب العادية ======
  const activeGame = getActiveGame(message.channelId);
  if (!activeGame) return;

  const guess = message.content.trim();

  if (activeGame.type === "hsr_guess") {
    if (normalizeArabic(guess) === normalizeArabic(activeGame.answer)) {
      clearActiveGame(message.channelId);
      addPoints(message.author.id, message.author.username, 15);
      await message.reply(`🎉 **${message.author.username}** أجاب صح! الإجابة: **${activeGame.answer}** — **+15 نقطة** 🏆`);
      setTimeout(() => launchRandom(message.channel), 3000);
    }
  } else if (activeGame.type === "scramble") {
    if (normalizeArabic(guess) === normalizeArabic(activeGame.answer)) {
      clearActiveGame(message.channelId);
      addPoints(message.author.id, message.author.username, 10);
      await message.reply(`🎉 **${message.author.username}** رتّب الكلمة! الإجابة: **${activeGame.answer}** — **+10 نقاط** 🏆`);
      setTimeout(() => launchRandom(message.channel), 3000);
    }
  }
});

// ============== XO ==============
async function handleXoButton(interaction) {
  const [, gameId, idxStr] = interaction.customId.split("_");
  const idx = parseInt(idxStr, 10);
  const game = xoCommand.xoGames.get(gameId);
  const { EmbedBuilder } = require("discord.js");

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

// ============== الألعاب التلقائية ==============
function startAutoGames() {
  if (!AUTO_GAME_CHANNEL_ID) {
    console.log("⚠️ AUTO_GAME_CHANNEL_ID غير محدد، الألعاب التلقائية متوقفة.");
    return;
  }
  console.log(`🎮 الألعاب التلقائية فعالة كل ${AUTO_GAME_INTERVAL_MS / 60000} دقيقة.`);
  setTimeout(() => {
    launchAutoGame();
    setInterval(launchAutoGame, AUTO_GAME_INTERVAL_MS);
  }, 60 * 1000);
}

async function launchAutoGame() {
  try {
    const channel = await client.channels.fetch(AUTO_GAME_CHANNEL_ID);
    if (!channel) return;
    if (getActiveGame(AUTO_GAME_CHANNEL_ID)) {
      console.log("⏭️ تجاوز اللعبة التلقائية — فيه لعبة شغالة.");
      return;
    }
    await launchRandom(channel);
  } catch (err) {
    console.error("❌ خطأ بإطلاق اللعبة التلقائية:", err);
  }
}

client.login(process.env.DISCORD_TOKEN);
