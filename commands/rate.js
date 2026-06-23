const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const ratings = [
  { score: "S+", comment: "هذا الشخص broken بالكامل، كيف؟! 💀" },
  { score: "S", comment: "top tier بلا كلام، الكون يحترمه 🔥" },
  { score: "A+", comment: "قوي بس يحتاج بيلد صح عشان يتألق ⭐" },
  { score: "A", comment: "solid، ما تندم إنك تعرفه 👍" },
  { score: "B+", comment: "متوسط بس له fans مخلصين ما يخلونه 😄" },
  { score: "B", comment: "يمشي الحال، بس فيه بدائل أحسن 🙃" },
  { score: "C", comment: "personality حلوة على الأقل، نشكر ربنا 😅" },
  { score: "D", comment: "مسكين، حتى أمه ما تشغله في endgame 💀" },
  { score: "F", comment: "أنا آسف بس الـ meta قاسية، والله ما أنا السبب 😭" },
  { score: "???", comment: "هذا الشخص يتجاوز كل scales معروفة، Mihoyo تخاف منه 🤯" },
];

const stats = [
  { name: "الجاذبية", values: ["منعدمة 💀", "أقل من الصفر 😭", "مقبولة 😐", "عالية ✨", "خطيرة 🔥"] },
  { name: "مستوى الخطورة", values: ["آمن تماماً 😇", "مشبوه شوي 🤨", "خطر متوسط ⚠️", "خطر عالي 🚨", "Calamity level 💀"] },
  { name: "قوة الشخصية", values: ["أضعف من Trailblazer بدون سلاح 😭", "4-star energy 😅", "solid 5-star 💪", "Limited SSR 🌟", "Harmony path god tier ✨"] },
  { name: "مستوى الدراما", values: ["ممل جداً 😴", "عادي 😐", "يجذب الانتباه 👀", "دراما ملحمية 🎭", "أحسن من قصة Robin 😭"] },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Sparxie تقيّم شخص بطريقة هزلية 😄")
    .addUserOption(opt =>
      opt.setName("target").setDescription("منشن الشخص اللي تبي تقيّمه").setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const rating = getRandom(ratings);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(`📊 تقييم ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "التقييم النهائي", value: `# ${rating.score}`, inline: false },
        { name: "تعليق Sparxie", value: rating.comment, inline: false },
        { name: stats[0].name, value: getRandom(stats[0].values), inline: true },
        { name: stats[1].name, value: getRandom(stats[1].values), inline: true },
        { name: stats[2].name, value: getRandom(stats[2].values), inline: false },
        { name: stats[3].name, value: getRandom(stats[3].values), inline: false },
      )
      .setFooter({ text: "هذا التقييم علمي بحت وما فيه تحيز 😇 • Sparxie Bot" });

    await interaction.reply({ embeds: [embed] });
  },
};