const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const bonkLines = [
  "*BONK* Sparxie تضرب **{target}** على الرأس LIVE! CHAT شافوا؟! 😤",
  "BONK! Sparxie تقول لـ **{target}**: هذا درس مجاني من الـ stream~ 💀",
  "*bonk* **{target}** يستاهل! Sparxie قررت والـ Sparxheads وافقوا 😂",
  "CLIP THAT BONK! **{target}** ما راح ينساها~ 🎭",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bonk")
    .setDescription("Sparxie تبونك شخص LIVE! 😤")
    .addUserOption(opt => opt.setName("target").setDescription("من يستاهل؟").setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const line = bonkLines[Math.floor(Math.random() * bonkLines.length)].replace("{target}", `**${target.username}**`);
    const embed = new EmbedBuilder().setColor(RED).setDescription(line).setThumbnail(target.displayAvatarURL({ size: 256 })).setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};