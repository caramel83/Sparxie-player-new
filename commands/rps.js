const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const rpsChoices = ["🪨 حجر", "📄 ورقة", "✂️ مقص"];
const rpsWins = { "🪨 حجر": "✂️ مقص", "📄 ورقة": "🪨 حجر", "✂️ مقص": "📄 ورقة" };

const rpsComments = {
  win: [
    "انت فزت؟! CLIP THAT! هذا نادر 😤",
    "ما صدقت... بس خذها، ما راح يتكرر 💅",
    "SUBSCRIBERS شافوا هذا؟! شخص فاز على Sparxie! 😱",
  ],
  lose: [
    "HAHA! في وجهك~ هذا clip of the day! 🎉",
    "Sparxie لا تخسر، هذا قانون Planarcadia ✨",
    "GG EZ! الـ Sparxheads شافوا هذا؟ 😂",
  ],
  draw: [
    "تعادل؟! Sparxie ما تقبل تعادل في stream حقتها! 😤",
    "هذا مو content! جرب مرة ثانية يا حبيبي~ 🎭",
    "بالنسبة لـ views، التعادل يعني خسارة! 💀",
  ],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("العب حجر ورقة مقص ضد Sparxie! ✂️")
    .addStringOption(opt =>
      opt.setName("choice").setDescription("اخترك").setRequired(true)
        .addChoices(
          { name: "🪨 حجر", value: "🪨 حجر" },
          { name: "📄 ورقة", value: "📄 ورقة" },
          { name: "✂️ مقص", value: "✂️ مقص" }
        )
    ),
  async execute(interaction) {
    const player = interaction.options.getString("choice");
    const bot = rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
    let result, color;
    if (player === bot) {
      result = rpsComments.draw[Math.floor(Math.random() * rpsComments.draw.length)];
      color = 0xFFA500;
    } else if (rpsWins[player] === bot) {
      result = rpsComments.win[Math.floor(Math.random() * rpsComments.win.length)];
      color = 0x00FF88;
    } else {
      result = rpsComments.lose[Math.floor(Math.random() * rpsComments.lose.length)];
      color = RED;
    }
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("✂️ حجر ورقة مقص LIVE!")
      .addFields(
        { name: "اختيارك", value: player, inline: true },
        { name: "اختيار Sparxie", value: bot, inline: true },
        { name: "النتيجة", value: result, inline: false }
      )
      .setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" });
    await interaction.reply({ embeds: [embed] });
  },
};