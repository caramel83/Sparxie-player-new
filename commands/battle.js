const { SlashCommandBuilder } = require("discord.js");
const {
  startChallenge, sendChallengeRound,
  startSparxieChallenge, sendSparxieChallengeRound,
} = require("../gameEngine");
const { getActiveChallenge } = require("../gameManager");

const MODE_CHOICES = [
  { name: "🎲 عشوائي (كل الألعاب)", value: "random_mix" },
  { name: "🔤 رتب الكلمة", value: "scramble" },
  { name: "🎮 خمن الشخصية", value: "guess_btn" },
  { name: "🧠 سؤال ثقافي", value: "trivia" },
  { name: "🌍 خمن العلم", value: "flags" },
  { name: "⚔️ سؤال HSR (عنصر/مسار/ندرة)", value: "quiz_battle" },
];

const MODE_LABELS = {
  random_mix: "وضع عشوائي",
  scramble: "رتب الكلمة",
  guess_btn: "خمن الشخصية",
  trivia: "سؤال ثقافي",
  flags: "خمن العلم",
  quiz_battle: "أسئلة HSR",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("تحدي شخص أو العب ضد Sparxie! 🎤⚔️")
    .addStringOption((opt) =>
      opt.setName("اللعبة").setDescription("أي لعبة تبي؟ (افتراضي: عشوائي)").setRequired(false).addChoices(...MODE_CHOICES)
    )
    .addUserOption((opt) =>
      opt.setName("الخصم").setDescription("تحدي شخص محدد (اتركه فاضي للعب ضد Sparxie)").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName("جولات").setDescription("عدد الجولات (افتراضي 5)").setRequired(false).setMinValue(1).setMaxValue(20)
    ),

  async execute(interaction) {
    const mode = interaction.options.getString("اللعبة") || "random_mix";
    const opponent = interaction.options.getUser("الخصم");
    const rounds = interaction.options.getInteger("جولات");
    const modeLabel = MODE_LABELS[mode] || "وضع عشوائي";

    if (getActiveChallenge(interaction.channelId)) {
      return interaction.reply({ content: "⚠️ فيه تحدي شغّال بهذي القناة بالفعل!", ephemeral: true });
    }

    // ====== بدون خصم = تحدي ضد Sparxie AI ======
    if (!opponent) {
      const challenge = startSparxieChallenge(interaction.channel, {
        challengerId: interaction.user.id,
        challengerName: interaction.user.username,
        mode,
        rounds,
      });

      await interaction.reply(
        `🎤 **${interaction.user.username}** يتحدى **★ Sparxie ★** بـ (${modeLabel})!\n` +
        `${challenge.totalRounds} جولات — هل تقدر تتغلب عليها؟! 😤✨\n` +
        `**+20 نقطة** للفوز على Sparxie 🏆`
      );
      setTimeout(() => sendSparxieChallengeRound(interaction.channel, challenge), 1500);
      return;
    }

    // ====== مع خصم = تحدي PvP ======
    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ content: "⚠️ اختار لاعب ثاني صح! أو اتركه فاضي للعب ضد Sparxie~", ephemeral: true });
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
      `⚔️ <@${interaction.user.id}> يتحدى <@${opponent.id}> بـ (${modeLabel})!\n` +
      `${challenge.totalRounds} جولات — والقناة كلها تقدر تشارك!\n**+20 نقطة** للفوز 🏆`
    );
    setTimeout(() => sendChallengeRound(interaction.channel, challenge), 1500);
  },
};
