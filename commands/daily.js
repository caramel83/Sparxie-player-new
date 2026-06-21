const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { addPoints, getLeaderboard } = require("../scoresManager");
const { RED } = require("../gameLauncher");
const { randomFrom } = require("../utils");
const fs = require("fs");
const path = require("path");

const DAILY_FILE = path.join(__dirname, "../daily.json");

function loadDaily() {
  if (!fs.existsSync(DAILY_FILE)) return { date: "", question: null, answers: {} };
  try { return JSON.parse(fs.readFileSync(DAILY_FILE, "utf8")); } catch { return { date: "", question: null, answers: {} }; }
}

function saveDaily(data) {
  fs.writeFileSync(DAILY_FILE, JSON.stringify(data, null, 2));
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function generateDailyQuestion() {
  const character = randomFrom(CHARACTERS);
  const types = ["element", "path", "rarity"];
  const type = randomFrom(types);
  let q, answer;
  if (type === "element") { q = `ما عنصر **${character.name}**؟`; answer = character.element; }
  else if (type === "path") { q = `ما مسار **${character.name}**؟`; answer = character.path; }
  else { q = `ما ندرة **${character.name}** (رقم فقط)؟`; answer = String(character.rarity); }
  return { question: q, answer, character: character.name };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("السؤال اليومي! أجب عليه مرة واحدة فقط")
    .addStringOption(opt =>
      opt.setName("إجابتك").setDescription("اكتب إجابتك هنا").setRequired(true)
    ),

  async execute(interaction) {
    let daily = loadDaily();
    const today = getToday();

    // إذا بدأ يوم جديد، نولد سؤال جديد
    if (daily.date !== today) {
      daily = { date: today, question: generateDailyQuestion(), answers: {} };
      saveDaily(daily);
    }

    const userId = interaction.user.id;

    if (daily.answers[userId]) {
      return interaction.reply({
        content: `⏰ جاوبت اليوم بالفعل! الإجابة الصحيحة: **${daily.question.answer}**\nارجع غداً للسؤال الجديد!`,
        ephemeral: true,
      });
    }

    const userAnswer = interaction.options.getString("إجابتك").trim().toLowerCase();
    const correct = daily.question.answer.toLowerCase();
    const isCorrect = userAnswer === correct;

    daily.answers[userId] = { username: interaction.user.username, correct: isCorrect };
    saveDaily(daily);

    if (isCorrect) {
      addPoints(userId, interaction.user.username, 25);
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle("✅ إجابة صحيحة!")
        .setDescription(`أحسنت **${interaction.user.username}**! حصلت على **+25 نقطة** 🎉\n\n${daily.question.question}\n**الجواب: ${daily.question.answer}**`);
      await interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle("❌ إجابة خاطئة!")
        .setDescription(`الإجابة كانت: **${daily.question.answer}**\nحظاً أوفر غداً!`);
      await interaction.reply({ embeds: [embed] });
    }
  },
};
