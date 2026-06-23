const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const Jimp = require("jimp");
const { RED } = require("../gameLauncher");

const GUNXIE_CONFIG = {
  template: path.join(__dirname, "../assets/gunxie_template.jpg"),
  hitter: { x: 1260, y: 155, size: 170 },
  victim: { x: 355, y: 200, size: 155 },
};

const GUNXIE_CAPTIONS = [
  "🔫 ذا remind me of Topaz 😂",
  "💥 يا حبيبي الـ AoE وصلك~",
  "🎯 precision strike! 💀",
  "✨ FIRE! بالحرفي~",
];

async function makeCircleAvatar(url, size) {
  const avatar = await Jimp.read(url);
  avatar.resize(size, size);
  const circle = new Jimp(size, size, 0x00000000);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      if (dx * dx + dy * dy <= (size / 2) * (size / 2)) {
        circle.setPixelColor(avatar.getPixelColor(x, y), x, y);
      }
    }
  }
  return circle;
}

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
      const template = await Jimp.read(GUNXIE_CONFIG.template);
      const av1 = await makeCircleAvatar(
        shooter.displayAvatarURL({ extension: "png", size: 256 }),
        GUNXIE_CONFIG.hitter.size
      );
      const av2 = await makeCircleAvatar(
        target.displayAvatarURL({ extension: "png", size: 256 }),
        GUNXIE_CONFIG.victim.size
      );
      template.composite(av1, GUNXIE_CONFIG.hitter.x - GUNXIE_CONFIG.hitter.size / 2, GUNXIE_CONFIG.hitter.y - GUNXIE_CONFIG.hitter.size / 2);
      template.composite(av2, GUNXIE_CONFIG.victim.x - GUNXIE_CONFIG.victim.size / 2, GUNXIE_CONFIG.victim.y - GUNXIE_CONFIG.victim.size / 2);
      const buffer = await template.getBufferAsync(Jimp.MIME_JPEG);

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