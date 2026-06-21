const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض كل الأوامر المتوفرة"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🎮 أوامر سباركسي")
      .addFields(
        {
          name: "🕹️ ألعاب تلقائية",
          value: "الألعاب تنطلق تلقائياً وتتابع بعضها!\nاستخدم الأزرار للتخطي أو الإيقاف.",
        },
        {
          name: "🎮 ألعاب يدوية",
          value:
            "`/guess` — تخمين شخصية HSR\n" +
            "`/duel شخصية:[اسم]` — جرب الـ 50/50\n" +
            "`/xo الخصم:[شخص]` — إكس أو\n" +
            "`/battle الخصم:[شخص]` — تحدي أسئلة HSR ⚔️\n" +
            "`/daily` — السؤال اليومي 🗓️",
        },
        {
          name: "🏆 نقاط وترتيب",
          value:
            "`/leaderboard` — لوحة الترتيب (أسبوعي/كلي)\n" +
            "✅ خمن صح: **+15 نقطة**\n" +
            "🔤 رتب الكلمة: **+10 نقاط**\n" +
            "❓ سؤال نعم/لا: **+5 نقاط**\n" +
            "⚔️ فوز البتل: **+20 نقطة**\n" +
            "🗓️ السؤال اليومي: **+25 نقطة**",
        },
        {
          name: "🎉 ترفيه",
          value:
            "`/ship` — شيّب شخصيتين 💘\n" +
            "`/rate [شخصية]` — تقييم كوميدي 📊\n" +
            "`/fact` — حقيقة HSR عشوائية 🌟\n" +
            "`/joke نوع:[عادية/HSR]` — نكتة",
        }
      )
      .setFooter({ text: "سباركسي — بوت Honkai: Star Rail ✨" });

    await interaction.reply({ embeds: [embed] });
  },
};
