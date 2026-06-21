const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { RED } = require("../gameLauncher");
const { randomFrom } = require("../utils");

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
    .setDescription("شيّب شخصيتين HSR مع بعض! 💘"),

  async execute(interaction) {
    const chars = [...CHARACTERS];
    const c1 = randomFrom(chars);
    let c2 = randomFrom(chars.filter(c => c.name !== c1.name));

    const compatibility = Math.floor(Math.random() * 101);
    const comment = randomFrom(shipComments);

    const hearts = Math.round(compatibility / 10);
    const heartBar = "❤️".repeat(hearts) + "🖤".repeat(10 - hearts);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("💘 Ship Meter!")
      .setDescription(
        `## ${c1.name} × ${c2.name}\n\n${heartBar}\n\n**${compatibility}%** توافق\n\n*${comment}*`
      );

    await interaction.reply({ embeds: [embed] });
  },
};
