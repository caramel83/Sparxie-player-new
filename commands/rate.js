const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { RED } = require("../gameLauncher");
const { randomFrom } = require("../utils");

const ratings = [
  { score: "S+", comment: "الحرة دي broken بالكامل، Mihoyo وش تسوي 💀" },
  { score: "S", comment: "شخصية قوية جداً، top tier بلا كلام 🔥" },
  { score: "A+", comment: "قوية وحلوة، بس تحتاج بيلد صح ⭐" },
  { score: "A", comment: "solid pick، ما تندم عليها 👍" },
  { score: "B+", comment: "متوسطة بس لها fans مخلصين 😄" },
  { score: "B", comment: "تمشي بس فيه بدائل أحسن منها 🙃" },
  { score: "C", comment: "يعني... personality حلوة على الأقل 😅" },
  { score: "D", comment: "مسكينة، محد يشغلها في الـ endgame 💀" },
  { score: "F", comment: "أنا آسف بس الـ meta قاسية 😭 — بس الـ design حلو!" },
  { score: "???", comment: "الشخصية هذي تتجاوز كل scales معروفة 🤯" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("قيّم شخصية HSR عشوائية بطريقة كوميدية!")
    .addStringOption(opt =>
      opt.setName("الشخصية").setDescription("اسم الشخصية (اختياري، وإلا عشوائي)")
    ),

  async execute(interaction) {
    const input = interaction.options.getString("الشخصية");
    let character;

    if (input) {
      character = CHARACTERS.find(c =>
        c.name.toLowerCase() === input.toLowerCase()
      );
      if (!character) {
        return interaction.reply({ content: `⚠️ ما لقيت شخصية باسم "${input}"`, ephemeral: true });
      }
    } else {
      character = randomFrom(CHARACTERS);
    }

    const rating = randomFrom(ratings);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(`📊 تقييم ${character.name}`)
      .addFields(
        { name: "الندرة", value: "⭐".repeat(character.rarity), inline: true },
        { name: "العنصر", value: character.element, inline: true },
        { name: "المسار", value: character.path, inline: true },
        { name: "التقييم", value: `# ${rating.score}`, inline: false },
        { name: "التعليق", value: rating.comment, inline: false }
      )
      .setFooter({ text: "هذا التقييم كوميدي بحت 😄" });

    await interaction.reply({ embeds: [embed] });
  },
};
