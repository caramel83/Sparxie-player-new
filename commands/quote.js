const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const quotes = [
  "LIKE! FOLLOW! STREAM! يالله شو انتظرتم؟! 🎉",
  "أنا مو بس streamer، أنا الـ content نفسه~ ✨",
  "الـ views ما تكذب، والكذب ما يجيب views~ 💅",
  "Sparxheads! وين انتم؟! الـ engagement يموت! 😱",
  "قالوا ما تقدرين تكوني مشهورة... شافوا channel حقتي الحين؟ 😤",
  "أنا مو villain، أنا content creator بـ vision مختلفة~ 🎭",
  "Party till the world ends! هذا مو شعار، هذا lifestyle! 🌟",
  "الـ haters بيشوفون stream حقتي ويقولون wow... بعدين يشتركون 😂",
  "ما فيه فرق بين Sparxie وSparkle، الفرق بس من يشوفك~ 💫",
  "كل يوم بدون stream يوم ضايع من حياتك! TUNE IN! 📡",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Sparxie تشارك حكمة من stream حقتها 🎭"),
  async execute(interaction) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setDescription(`*"${quote}"*\n\n— ★ **Sparxie** ★ 📡`)
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};