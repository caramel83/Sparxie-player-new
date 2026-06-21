const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../scoresManager");
const { RED } = require("../gameLauncher");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("عرض لوحة الترتيب")
    .addStringOption(opt =>
      opt.setName("نوع")
        .setDescription("أسبوعي أو كلي؟")
        .addChoices(
          { name: "🗓️ هذا الأسبوع", value: "weekly" },
          { name: "🏆 الكلي", value: "total" }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString("نوع") || "weekly";
    const top = getLeaderboard(type, 10);
    const label = type === "weekly" ? "🗓️ ترتيب الأسبوع" : "🏆 الترتيب الكلي";

    if (top.length === 0) {
      return interaction.reply({ content: "⚠️ ما فيه نقاط بعد!", ephemeral: true });
    }

    const medals = ["🥇", "🥈", "🥉"];
    const desc = top.map((p, i) =>
      `${medals[i] || `**${i + 1}.**`} **${p.username}** — ${p.points} نقطة`
    ).join("\n");

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(label)
      .setDescription(desc);

    await interaction.reply({ embeds: [embed] });
  },
};
