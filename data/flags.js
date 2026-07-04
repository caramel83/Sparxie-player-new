// commands/flags.js — لعبة خمن العلم (4 أزرار اختيار)
const { SlashCommandBuilder } = require("discord.js");
const { launchOpenGame, startChallenge, sendChallengeRound } = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("flags")
    .setDescription("خمن علم الدولة من 4 خيارات! 🌍")
    .addUserOption((opt) =>
      opt.setName("الخصم").setDescription("تحدي شخص محدد (اختياري)").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName("جولات").setDescription("عدد الجولات بالتحدي (افتراضي 5)").setRequired(false).setMinValue(1).setMaxValue(20)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser("الخصم");
    const rounds = interaction.options.getInteger("جولات");

    if (!opponent) {
      await interaction.reply({ content: "🌍 ابدأت لعبة خمن العلم بالقناة!", ephemeral: true });
      await launchOpenGame(interaction.channel, "flags");
      return;
    }

    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ content: "⚠️ اختار شخص ثاني صح!", ephemeral: true });
    }
    if (getActiveChallenge(interaction.channelId)) {
      return interaction.reply({ content: "⚠️ فيه تحدي شغّال بهذي القناة بالفعل!", ephemeral: true });
    }

    const challenge = startChallenge(interaction.channel, {
      challengerId: interaction.user.id,
      challengerName: interaction.user.username,
      opponentId: opponent.id,
      opponentName: opponent.username,
      mode: "flags",
      rounds,
    });

    await interaction.reply(
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بلعبة خمن العلم! والقناة كلها تقدر تشارك~`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
