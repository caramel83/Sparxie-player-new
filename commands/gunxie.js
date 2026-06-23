const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");
const { GUNXIE_CONFIG, GUNXIE_CAPTIONS, buildMeme } = require("./slap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gunxie")
    .setDescription("Topaz تصوّب على الضحية 🔫")
    .addUserOption(opt => opt.setName("shooter").setDescription("الشخص اللي يصوّب 🔫").setRequired(true))
    .addUserOption(opt => opt.setName("target").setDescription("الشخص اللي يتصوّب عليه 😱").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const shooter = interaction.options.getUser("shooter");
    const target = interaction.options.getUser("target");

    try {
      const url1 = shooter.displayAvatarURL({ extension: "png", size: 256 });
      const url2 = target.displayAvatarURL({ extension: "png", size: 256 });
      const buffer = await buildMeme(GUNXIE_CONFIG, url1, url2);

      const caption = GUNXIE_CAPTIONS[Math.floor(Math.random() * GUNXIE_CAPTIONS.length)];
      const attachment = new AttachmentBuilder(buffer, { name: "gunxie.jpg" });
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(`**${shooter.username}** يصوّب على **${target.username}**! 🎯\n\n${caption}`)
        .setImage("attachment://gunxie.jpg")
        .setFooter({ text: "✨ Sparxie Bot • Honkai: Star Rail" });

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (e) {
      await interaction.editReply({ content: `❌ صارت مشكلة: \`${e.message}\`` });
    }
  },
};
