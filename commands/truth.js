const { SlashCommandBuilder } = require("discord.js");
const { launchOpenGame } = require("../gameEngine");

module.exports = {
  data: new SlashCommandBuilder().setName("truth").setDescription("Sparxie تسألك سؤال صراحة! 👀"),
  async execute(interaction) {
    await interaction.reply({ content: "👀 سؤال صراحة جديد بالقناة!", ephemeral: true });
    await launchOpenGame(interaction.channel, "truth");
  },
};
