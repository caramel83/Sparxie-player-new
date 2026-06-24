const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameEngine");
const { DAILY_CHANNEL_ID } = require("../config");

// السؤال اليومي الجديد ينشر تلقائياً بقناة محددة (DAILY_CHANNEL_ID).
// هذا الأمر بس يعرض معلومات/تذكير للمستخدم، لأن التصويت نفسه يصير بالقناة المخصصة.
module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("معلومات عن السؤال اليومي 🗓️"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🗓️ السؤال اليومي")
      .setDescription(
        DAILY_CHANNEL_ID
          ? `السؤال اليومي ينشر تلقائياً كل يوم في <#${DAILY_CHANNEL_ID}>!\n\nصوّت بالأزرار هناك، والنتيجة تُعلن بعد 24 ساعة.\n\n🏆 **النقاط:** أول 25 • ثاني 20 • ثالث 15 • رابع 10 • الباقي 5 لكل واحد`
          : "⚠️ السؤال اليومي غير مفعّل حالياً، لازم تحديد قناة DAILY_CHANNEL_ID بالإعدادات."
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
