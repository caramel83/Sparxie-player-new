// commands/remind.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Sparxie تذكرك بشي LIVE! ⏰")
    .addStringOption(opt => opt.setName("message").setDescription("وش تبي تتذكر؟").setRequired(true))
    .addIntegerOption(opt => opt.setName("minutes").setDescription("بعد كم دقيقة؟").setRequired(true).setMinValue(1).setMaxValue(1440)),
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const minutes = interaction.options.getInteger("minutes");
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setDescription(`⏰ NOTED! Sparxie راح تذكرك بـ **"${message}"** بعد **${minutes}** دقيقة~\n\nSparxheads شهود على هذا! 📡`)
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
    setTimeout(async () => {
      try {
        await interaction.followUp({ content: `⏰ ${interaction.user} WAKE UP!\n\nSparxie تذكرك LIVE بـ **"${message}"**!\n\n*ذكرتك، الحين لا عندي ذنب~ CLIP THAT! 😌*` });
      } catch {}
    }, minutes * 60 * 1000);
  },
};