// commands/wouldyourather.js
const { SlashCommandBuilder } = require("discord.js");
const { launchOpenGame } = require("../gameEngine");

module.exports = {
  data: new SlashCommandBuilder().setName("wouldyourather").setDescription("Sparxie تسألك: تفضل كذا أو كذا؟ 🤔"),
  async execute(interaction) {
    await interaction.reply({ content: "🤔 سؤال تفضيل جديد بالقناة!", ephemeral: true });
    await launchOpenGame(interaction.channel, "wyr");
  },
};
