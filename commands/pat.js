const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const patLines = [
  "*Sparxie تربت على رأس **{target}** أمام الـ chat* GOOD JOB! هذا يستاهل clip~ ✨",
  "Sparxie تقول لـ **{target}**: أنت من أحسن الـ Sparxheads~ PAT PAT! 🎭",
  "CHAT! شافوا؟ Sparxie تربت على **{target}**! هذا rare content~ 💕",
  "*pat pat* Sparxie فخورة فيك يا **{target}**! LIKE THIS MOMENT! 🌟",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pat")
    .setDescription("Sparxie تربت على رأس شخص LIVE! 🤚")
    .addUserOption(opt =>
      opt.setName("target").setDescription("من تبي Sparxie تربت عليه؟").setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const line = patLines[Math.floor(Math.random() * patLines.length)]
      .replace("{target}", `**${target.username}**`);
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(line)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};