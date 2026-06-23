const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const cuddleLines = [
  "AWWW! Sparxie تحضن **{target}** LIVE على الـ stream! 🥺 CHAT شافوا هذا؟!",
  "*Sparxie تحضن **{target}** وترفض تفك* هذا exclusive content للـ Sparxheads~ 💕",
  "Sparxie تدلع **{target}**! هذا أحسن moment في الـ stream اليوم~ ✨",
  "CLIP THAT! Sparxie تحضن **{target}**! هذا ما يصير كل يوم~ 🎭",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cuddle")
    .setDescription("Sparxie تدلع شخص LIVE! 🥺")
    .addUserOption(opt =>
      opt.setName("target").setDescription("من تبي Sparxie تدلعه؟").setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const line = cuddleLines[Math.floor(Math.random() * cuddleLines.length)]
      .replace("{target}", `**${target.username}**`);
    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setDescription(line)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};