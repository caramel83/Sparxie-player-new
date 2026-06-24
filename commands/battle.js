const { SlashCommandBuilder } = require("discord.js");
const { startChallenge, sendChallengeRound } = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("تحدي لاعب ثاني في أسئلة HSR!")
    .addUserOption((opt) =>
      opt.setName("الخصم").setDescription("اللاعب اللي تبي تتحداه").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("جولات").setDescription("عدد الجولات (افتراضي 5)").setRequired(false).setMinValue(1).setMaxValue(20)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser("الخصم");
    const rounds = interaction.options.getInteger("جولات");

    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ content: "⚠️ اختار لاعب ثاني صح!", ephemeral: true });
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
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بأسئلة HSR! ${challenge.totalRounds} جولات — والقناة كلها تقدر تشارك!\n**+20 نقطة** للفوز بالتحدي 🏆`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
