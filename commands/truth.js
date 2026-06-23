const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const questions = [
  "ما أكثر شي تندم عليه في حياتك؟ CHAT يبي يعرف! 👀",
  "من أفضل شخص في السيرفر؟ قول بصراحة LIVE~ 😏",
  "كم ساعة تلعب ألعاب يومياً؟ الحقيقة! Sparxie تعرف 😂",
  "من تبي تبونكه الحين في السيرفر؟ 👀",
  "ما أغرب شي سويته وحدك؟ CHAT يبي يسمع! 🎭",
  "لو تقدر تحذف شخص من السيرفر من يكون؟ 👀",
  "ما أخجل موقف مررت فيه؟ STREAM EXCLUSIVE! 😱",
  "كم مرة سويت pity وما جاك الـ 5 star؟ 😭",
];

module.exports = {
  data: new SlashCommandBuilder().setName("truth").setDescription("Sparxie تسألك سؤال صراحة LIVE! 👀"),
  async execute(interaction) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    const embed = new EmbedBuilder().setColor(RED).setTitle("👀 سؤال صراحة LIVE!").setDescription(`*Sparxie تنظر للـ chat بجدية...*\n\n**${q}**`).setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};