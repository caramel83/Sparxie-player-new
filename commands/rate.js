const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const ratings = [
  { score: "S+", comment: "يالله~ هذا الشخص خطير بصراحة، حتى أنا ما أقدر أتجاهله! ✨" },
  { score: "S", comment: "ممتاز! تقريباً بمستواي~ تقريباً 💅" },
  { score: "A+", comment: "مو سيء! بس يحتاج يتعلم من Sparxie شوي 😌" },
  { score: "A", comment: "أنا شايفة فيك potential! ما تيأس~ 🎭" },
  { score: "B+", comment: "يعني... فيه أمل! بس بعيد عن مستواي 😂" },
  { score: "B", comment: "عادي عادي~ مو كل الناس تقدر تكون Sparxie 🤷" },
  { score: "C", comment: "هممم... أنا شايفاك من الجمهور مو من المسرح 😬" },
  { score: "D", comment: "صراحة؟ حتى Ratio أحسن منك وهذا شي ما أقوله بسهولة 💀" },
  { score: "F", comment: "ما أدري كيف أقول هذا بلطف... ما أقدر 😭 L كبيرة" },
  { score: "???", comment: "أنا Sparxie وما أفهم هذا الشخص... وهذا نادر جداً 🤯" },
];

const comments = [
  { name: "✨ الكاريزما", values: ["أقل من الصفر 😭", "تحتاج دروس 😬", "مقبولة 😐", "لافتة للنظر 👀", "Sparxie level 💅"] },
  { name: "🎭 مستوى الدراما", values: ["ممل للموت 😴", "عادي 😐", "مثير أحياناً 👀", "دراما يومية 🎭", "أحسن من بثوثي 😭"] },
  { name: "⭐ التميز", values: ["طيف في الجمهور 👻", "وجه مألوف 🤔", "ملاحظ أحياناً ✨", "نجم صاعد 🌟", "منافس خطير 💀"] },
  { name: "🎪 رأي Sparxie", values: ["ما راح أذكره في بثي 😂", "ممكن أذكره بالغلط 😅", "شخص محترم 😌", "أتمنى يحضر بثوثي ✨", "STAN مضمون 💕"] },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Sparxie تقيّم شخص بأسلوبها الخاص 🎭")
    .addUserOption(opt =>
      opt.setName("target").setDescription("منشن الشخص اللي تبي Sparxie تقيّمه").setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const rating = getRandom(ratings);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(`🎭 Sparxie تقيّم ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "التقييم النهائي", value: `# ${rating.score}`, inline: false },
        { name: "💬 تعليق Sparxie", value: rating.comment, inline: false },
        { name: comments[0].name, value: getRandom(comments[0].values), inline: true },
        { name: comments[1].name, value: getRandom(comments[1].values), inline: true },
        { name: comments[2].name, value: getRandom(comments[2].values), inline: true },
        { name: comments[3].name, value: getRandom(comments[3].values), inline: false },
      )
      .setFooter({ text: "تقييم Sparxie الرسمي™ • لا تزعل، هذا كوميدي 😇" });

    await interaction.reply({ embeds: [embed] });
  },
};