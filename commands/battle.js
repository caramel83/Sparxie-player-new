const { SlashCommandBuilder } = require("discord.js");
const { startChallenge, sendChallengeRound, launchOpenGame } = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

// /battle = الوضع "عشوائي" — يخلط بين رتب الكلمة + خمن الشخصية + سؤال ثقافي + أسئلة HSR
module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("وضع عشوائي يخلط كل الألعاب! تحدي شخص أو العب جماعي 🎲")
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
      await interaction.reply({ content: "🎲 ابدأت الوضع العشوائي بالقناة!", ephemeral: true });
      await launchOpenGame(interaction.channel, "random_mix");
      return;
    }

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
      mode: "random_mix",
      rounds,
    });

    await interaction.reply(
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بوضع عشوائي (رتب/خمن/ثقافي/HSR)! ${challenge.totalRounds} جولات — والقناة كلها تقدر تشارك!\n**+20 نقطة** للفوز بالتحدي 🏆`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
