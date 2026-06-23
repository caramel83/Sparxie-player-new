const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const answers = [
  "ABSOLUTELY YES! CLIP THAT! ✨",
  "أكيد! Sparxie تضمن~ 💅",
  "الـ Sparxheads يقولون نعم! 🎉",
  "LIVE PREDICTION: نعم~ 📡",
  "ممكن... بس Sparxie غير متأكدة وهذا نادر 🤔",
  "الـ algorithm يقول ربما~ 😬",
  "اسأل مرة ثانية، الـ stream lag~ 🎭",
  "CHAT DIVIDED! نص يقول نعم ونص لا 😂",
  "لا. وهذا final answer~ 💀",
  "ABSOLUTELY NOT! هذا L كبيرة 😭",
  "الـ Sparxheads يبوسون هذا السؤال~ NO! 😤",
  "Sparxie تغلق الـ stream على هذا السؤال 💀",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("اسأل Sparxie أي سؤال وهي تجاوبك LIVE! 🎱")
    .addStringOption(opt =>
      opt.setName("question").setDescription("سؤالك للـ stream~").setRequired(true)
    ),
  async execute(interaction) {
    const question = interaction.options.getString("question");
    const answer = answers[Math.floor(Math.random() * answers.length)];
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🎱 Sparxie LIVE Q&A!")
      .addFields(
        { name: "❓ سؤال من الـ chat", value: question, inline: false },
        { name: "🎭 Sparxie تجاوب LIVE", value: answer, inline: false }
      )
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};