// commands/guess.js — تخمين الشخصية (4 أزرار اختيار)
const { SlashCommandBuilder } = require("discord.js");
const { launchOpenGame, startChallenge, sendChallengeRound } = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guess")
    .setDescription("خمن شخصية HSR من 4 خيارات! 🎮")
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
      await interaction.reply({ content: "🎮 ابدأت لعبة تخمين الشخصية بالقناة!", ephemeral: true });
      await launchOpenGame(interaction.channel, "guess_btn");
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
      mode: "quiz_battle",
      rounds,
    });

    await interaction.reply(
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بتخمين شخصيات HSR! والقناة كلها تقدر تشارك~`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
