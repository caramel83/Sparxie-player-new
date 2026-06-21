const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { RED } = require("../gameLauncher");
const { randomFrom } = require("../utils");

const HSR_FACTS = [
  "الـ Trailblazer هو الشخصية الوحيدة اللي تقدر تغير مسارها في اللعبة.",
  "Honkai: Star Rail صدر رسمياً في أبريل 2023.",
  "العالم في HSR مبني على القطارات الكونية اللي تسافر بين النجوم.",
  "Seele هي أول شخصية 5 نجوم Limited تصدر في اللعبة.",
  "اسم Kafka مأخوذ من الكاتب Franz Kafka.",
  "الـ Stellaron هي بذور الدمار اللي تنتشر في الكون.",
  "Silver Wolf متخصصة في اختراق الأنظمة وتغيير واقع الأعداء.",
  "Acheron ترتبط بشكل غامض بالـ Nihility وهي من الشخصيات الأقوى في اللعبة.",
  "الـ Nameless هو الاسم اللي يطلق على Trailblazer وصحبه.",
  "Pom-Pom هو الكائن اللي يستقبلك في قطار Astral Express.",
  "الـ Aeons هم الكائنات الإلهية اللي تتحكم في مسارات الكون.",
  "مسار Remembrance أضيف في الإصدار 3.0.",
  "Ruan Mei هي باحثة في مشروع Memoria وعبقرية في الـ biology.",
  "Sunday هو أخ Robin الكبير، وكلاهم من Oak Family.",
  "Robin استلهمت موسيقاها من رحلاتها عبر الكون.",
  "الـ Simulated Universe هو محاكاة رقمية أنشأها Herta.",
  "Firefly اسمها الحقيقي مرتبط بمشروع SAM السري.",
  "Boothill كاوبوي من المستقبل ينتقم لماضيه.",
  "Jiaoqiu يستطيع رؤية الحظ والمصير في الشخصيات.",
  "الـ Memory Bubble هي أساس عالم Penacony كله.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("حقيقة عشوائية عن Honkai: Star Rail! 🌟"),

  async execute(interaction) {
    const fact = randomFrom(HSR_FACTS);
    const character = randomFrom(CHARACTERS);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("🌟 هل تعلم؟")
      .setDescription(fact)
      .setFooter({ text: `شخصية اليوم: ${character.name} ${character.element} | ${character.path}` });

    await interaction.reply({ embeds: [embed] });
  },
};
