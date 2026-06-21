const { SlashCommandBuilder } = require("discord.js");
const NORMAL_JOKES = require("../data/normal_jokes");
const HSR_JOKES = require("../data/hsr_jokes");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("سباركسي يجيب لك نكتة 😄")
    .addStringOption((option) =>
      option
        .setName("نوع")
        .setDescription("نوع النكتة")
        .setRequired(true)
        .addChoices(
          { name: "نكتة عادية", value: "normal" },
          { name: "نكتة هونكاي ستار رايل", value: "hsr" }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString("نوع");
    const list = type === "hsr" ? HSR_JOKES : NORMAL_JOKES;
    const joke = list[Math.floor(Math.random() * list.length)];

    await interaction.reply(`😂 ${joke}`);
  },
};
