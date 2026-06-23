// commands/weather.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const responses = [
  "☀️ حار جداً! زي طاقة Sparxie في الـ stream~ خذ ماء! 🔥",
  "🌧️ شتاء وأمطار! مثالي للـ gaming وتشغيل stream حقتي~ 😌",
  "⛅ غائم! زي مزاج الـ chat لما ما فيه content 💀",
  "🌪️ عاصفة! زي banner جديد على محفظتك 😭",
  "❄️ برد شديد! حتى Belobog أدفأ~ 🥶",
  "🌈 جو ممتاز! Sparxie توصي بالخروج... أو stream معها 😄",
  "🌫️ ضبابي! زي مستقبل الـ gacha حقتك 💅",
  "⚡ عواصف رعدية! ابقى في البيت وشاهد stream Sparxie! 📡",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("Sparxie تتنبأ الطقس LIVE! 🌤️")
    .addStringOption(opt => opt.setName("city").setDescription("اسم المدينة").setRequired(true)),
  async execute(interaction) {
    const city = interaction.options.getString("city");
    const response = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(`🌤️ LIVE WEATHER REPORT: ${city}!`)
      .setDescription(`*Sparxie تنظر في الـ stream analytics...*\n\n${response}`)
      .setFooter({ text: "توقعات كوميدية مو حقيقية 😄 • LIKE! FOLLOW! STREAM! ✨" });
    await interaction.reply({ embeds: [embed] });
  },
};