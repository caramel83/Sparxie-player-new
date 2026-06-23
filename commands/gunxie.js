const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");
const { buildMeme } = require("./slap");
const path = require("path");

const GUNXIE_CONFIG = {
  template: path.join(__dirname, "../assets/gunxie_template.jpg"),
  hitter: { x: 1260, y: 210, size: 175 },
  victim: { x: 390, y: 290, size: 160 },
};

const GUNXIE_CAPTIONS = [
  "🔫 ذا remind me of Topaz 😂",
  "💥 يا حبيبي الـ AoE وصلك~",
  "🎯 precision strike! 💀",
  "✨ FIRE! بالحرفي~",
];

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
      const buffer = await buildMeme(
        GUNXIE_CONFIG,
        shooter.displayAvatarURL({ extension: "png", size: 256 }),
        target.displayAvatarURL({ extension: "png", size: 256 })
      );
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