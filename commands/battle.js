const { SlashCommandBuilder } = require("discord.js");
const { startChallenge, sendChallengeRound, launchOpenGame } = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

// خيارات اللعبة المتاحة بـ /battle — يحدد المستخدم أي لعبة يبي التحدي/اللعب الجماعي يستخدمها
const MODE_CHOICES = [
  { name: "🎲 عشوائي (كل الألعاب)", value: "random_mix" },
  { name: "🔤 رتب الكلمة", value: "scramble" },
  { name: "🎮 خمن الشخصية", value: "guess_btn" },
  { name: "🧠 سؤال ثقافي", value: "trivia" },
  { name: "🌍 خمن العلم", value: "flags" },
  { name: "⚔️ سؤال HSR (عنصر/مسار/ندرة)", value: "quiz_battle" },
];

const MODE_LABELS = {
  random_mix: "وضع عشوائي (رتب/خمن/ثقافي/أعلام/HSR)",
  scramble: "رتب الكلمة",
  guess_btn: "خمن الشخصية",
  trivia: "سؤال ثقافي",
  flags: "خمن العلم",
  quiz_battle: "أسئلة HSR",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("تحدي شخص أو العب جماعي — اختار أي لعبة تبي! 🎲")
    .addStringOption((opt) =>
      opt
        .setName("اللعبة")
        .setDescription("أي لعبة تبي تلعب؟ (افتراضي: عشوائي)")
        .setRequired(false)
        .addChoices(...MODE_CHOICES)
    )
    .addUserOption((opt) =>
      opt.setName("الخصم").setDescription("تحدي شخص محدد (اختياري)").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName("جولات").setDescription("عدد الجولات بالتحدي (افتراضي 5)").setRequired(false).setMinValue(1).setMaxValue(20)
    ),

  async execute(interaction) {
    const mode = interaction.options.getString("اللعبة") || "random_mix";
    const opponent = interaction.options.getUser("الخصم");
    const rounds = interaction.options.getInteger("جولات");
    const modeLabel = MODE_LABELS[mode] || "وضع عشوائي";

    if (!opponent) {
      await interaction.reply({ content: `🎲 ابدأت لعبة (${modeLabel}) بالقناة!`, ephemeral: true });
      await launchOpenGame(interaction.channel, mode);
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
      mode,
      rounds,
    });

    await interaction.reply(
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بـ (${modeLabel})! ${challenge.totalRounds} جولات — والقناة كلها تقدر تشارك!\n**+20 نقطة** للفوز بالتحدي 🏆`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
