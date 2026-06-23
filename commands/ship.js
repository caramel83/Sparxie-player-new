const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const shipComments = [
  "والله ما أشوف توافق 😅",
  "ربما! بس بشرط ما يتشاجرون كل يوم 😂",
  "توافق ممتاز، الكون يشجعهم! ✨",
  "هذا الشيب مكتوب في النجوم ⭐",
  "لا أعتقد... المسارات مختلفة جداً 🙈",
  "عناصرهم متضادة بس القلوب مش كذا! ❤️‍🔥",
  "Canon ship بكل وضوح 👀",
  "Rivals to lovers potential هنا 👀",
  "هذا الشيب يكسر الـ lore بالكامل 💀",
  "الـ fandom راح يهبل على هذا الشيب 😭",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("شيّب شخصين مع بعض! 💘")
    .addUserOption(opt => opt.setName("person1").setDescription("الشخص الأول 💕").setRequired(true))
    .addUserOption(opt => opt.setName("person2").setDescription("الشخص الثاني 💕").setRequired(true)),

  async execute(interaction) {
    const p1 = interaction.options.getUser("person1");
    const p2 = interaction.options.getUser("person2");

    // نفس النتيجة لنفس الزوج دايماً
    const seed = Math.min(p1.id, p2.id) + Math.max(p1.id, p2.id);
    let hash = 0;
    for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) % 101;
    const score = hash;

    const hearts = Math.round(score / 10);
    const heartBar = "❤️".repeat(hearts) + "🖤".repeat(10 - hearts);
    const comment = shipComments[Math.floor(Math.random() * shipComments.length)];

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("💘 Ship Meter!")
      .setDescription(
        `## ${p1.username} × ${p2.username}\n\n${heartBar}\n\n**${score}%** توافق\n\n*${comment}*`
      );

    await interaction.reply({ embeds: [embed] });
  },
};