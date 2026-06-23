const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const ratings = [
  { score: "S+", comment: "broken بالكامل، Mihoyo وش تسوي 💀" },
  { score: "S", comment: "top tier بلا كلام 🔥" },
  { score: "A+", comment: "قوي بس يحتاج بيلد صح ⭐" },
  { score: "A", comment: "solid pick، ما تندم 👍" },
  { score: "B+", comment: "متوسط بس له fans مخلصين 😄" },
  { score: "B", comment: "تمشي بس فيه بدائل أحسن 🙃" },
  { score: "C", comment: "personality حلوة على الأقل 😅" },
  { score: "D", comment: "مسكين، محد يشغله في endgame 💀" },
  { score: "F", comment: "أنا آسف بس الـ meta قاسية 😭" },
  { score: "???", comment: "يتجاوز كل scales معروفة 🤯" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Sparxie تقيّم عضو في السيرفر ⭐")
    .addUserOption(opt =>
      opt.setName("target").setDescription("العضو اللي تبي تقيّمه").setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const rating = ratings[Math.floor(Math.random() * ratings.length)];

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(`📊 تقييم ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "التقييم", value: `# ${rating.score}`, inline: false },
        { name: "تعليق Sparxie", value: rating.comment, inline: false }
      )
      .setFooter({ text: "هذا التقييم كوميدي بحت 😄 • Sparxie Bot" });

    await interaction.reply({ embeds: [embed] });
  },
};