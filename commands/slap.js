const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const Jimp = require("jimp");
const { RED } = require("../gameLauncher");

const SLAP_CONFIG = {
  template: path.join(__dirname, "../assets/slap_template.jpg"),
  hitter: { x: 430, y: 140, size: 155 },
  victim: { x: 790, y: 220, size: 145 },
};

const SLAP_CAPTIONS = [
  "🎭 *Sparxie تضحك* هههههه يستاهل!!",
  "✨ ذا يذكرني بـ Topaz لما تزعل 💅",
  "🌟 *تصفق* BRAVO! أداء رائع~",
  "💫 الـ damage ما يحتاج بفر~ هههه",
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

async function buildMeme(config, url1, url2) {
  const template = await Jimp.read(config.template);
  const av1 = await makeCircleAvatar(url1, config.hitter.size);
  const av2 = await makeCircleAvatar(url2, config.victim.size);
  template.composite(av1, config.hitter.x - config.hitter.size / 2, config.hitter.y - config.hitter.size / 2);
  template.composite(av2, config.victim.x - config.victim.size / 2, config.victim.y - config.victim.size / 2);
  return await template.getBufferAsync(Jimp.MIME_JPEG);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slap")
    .setDescription("Sparxie تسلّط الضارب على الضحية 🎭")
    .addUserOption(opt => opt.setName("hitter").setDescription("الشخص اللي بيضرب 👊").setRequired(true))
    .addUserOption(opt => opt.setName("victim").setDescription("الشخص اللي بينضرب 😵").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const hitter = interaction.options.getUser("hitter");
    const victim = interaction.options.getUser("victim");
    try {
      const buffer = await buildMeme(
        SLAP_CONFIG,
        hitter.displayAvatarURL({ extension: "png", size: 256 }),
        victim.displayAvatarURL({ extension: "png", size: 256 })
      );
      const caption = SLAP_CAPTIONS[Math.floor(Math.random() * SLAP_CAPTIONS.length)];
      const attachment = new AttachmentBuilder(buffer, { name: "slap.jpg" });
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(`**${hitter.username}** يصفع **${victim.username}**! 💢\n\n${caption}`)
        .setImage("attachment://slap.jpg")
        .setFooter({ text: "✨ Sparxie Bot • Honkai: Star Rail" });
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (e) {
      await interaction.editReply({ content: `❌ صارت مشكلة: \`${e.message}\`` });
    }
  },

  buildMeme,
};