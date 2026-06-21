const { SlashCommandBuilder } = require("discord.js");
const { CHARACTERS, STANDARD_LOSE_POOL } = require("../data/characters");

// كل الشخصيات اللي ممكن "يفوز" فيها اللاعب (مستثنى منها السبع القياسية)
const WIN_POOL = CHARACTERS.filter(
  (c) => !STANDARD_LOSE_POOL.includes(c.name)
).map((c) => c.name);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duel")
    .setDescription("جرب حظك بنظام الـ 50/50! 🎲")
    .addStringOption((option) =>
      option
        .setName("شخصية")
        .setDescription("اكتب اسم الشخصية اللي تبي تفوز فيها")
        .setRequired(true)
    ),

  async execute(interaction) {
    const wanted = interaction.options.getString("شخصية").trim();

    // قرعة عشوائية: 50% فوز - 50% خسارة
    const isWin = Math.random() < 0.5;

    if (isWin) {
      await interaction.reply(
        `🎉 **فزت بالـ 50/50!**\n${interaction.user.username} حصل على **${wanted}**! 🌟`
      );
    } else {
      const lostTo =
        STANDARD_LOSE_POOL[
          Math.floor(Math.random() * STANDARD_LOSE_POOL.length)
        ];
      await interaction.reply(
        `💔 **خسرت الـ 50/50!**\n${interaction.user.username} كان يبي **${wanted}**، بس طلعت معه **${lostTo}** من القياسية. حظ أوفر المرة الجاية! 😅`
      );
    }
  },
};
