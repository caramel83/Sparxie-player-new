// commands/wouldyourather.js
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const questions = [
  ["تكون Sparxie وتكون streamer مشهورة للأبد 📡", "تكون Sparkle وتعيش في المسرح للأبد 🎭"],
  ["تلعب HSR بدون pulls للأبد 😭", "تلعب بـ 5 star بس ما تختار 💀"],
  ["تنام 20 ساعة يومياً 😴", "ما تنام وتشاهد anime طول الليل 👀"],
  ["تعيش في Penacony وتحلم للأبد 🌙", "تعيش في Belobog وتتحمل البرد ❄️"],
  ["تكون Sparxhead وتشاهد كل stream 📺", "تكون content creator بدون fans 😢"],
  ["ما تقدر تقول لا لأحد أبداً 😰", "ما تقدر تقول نعم لأحد أبداً 😤"],
];

module.exports = {
  data: new SlashCommandBuilder().setName("wouldyourather").setDescription("Sparxie تسألك: تفضل كذا أو كذا؟ 🤔"),
  async execute(interaction) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("wyr_1").setLabel("1️⃣ الأول").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("wyr_2").setLabel("2️⃣ الثاني").setStyle(ButtonStyle.Danger)
    );
    const msg = await interaction.reply({
      embeds: [new EmbedBuilder().setColor(RED).setTitle("🤔 WOULD YOU RATHER? LIVE!").addFields({ name: "1️⃣", value: q[0] }, { name: "2️⃣", value: q[1] }).setFooter({ text: "LIKE! FOLLOW! STREAM! ✨ Sparxie Bot" })],
      components: [row], fetchReply: true
    });
    const votes = { wyr_1: 0, wyr_2: 0 };
    const voted = new Set();
    const collector = msg.createMessageComponentCollector({ time: 30000 });
    collector.on("collect", async i => {
      if (voted.has(i.user.id)) return i.reply({ content: "صوّتت بالفعل! 😄", ephemeral: true });
      voted.add(i.user.id);
      votes[i.customId]++;
      await i.reply({ content: `اخترت **${i.customId === "wyr_1" ? q[0] : q[1]}**! ✅`, ephemeral: true });
    });
    collector.on("end", async () => {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(RED).setTitle("🤔 نتيجة التصويت LIVE!").addFields({ name: `1️⃣ ${q[0]}`, value: `**${votes.wyr_1}** صوت`, inline: true }, { name: `2️⃣ ${q[1]}`, value: `**${votes.wyr_2}** صوت`, inline: true }).setFooter({ text: "✨ Sparxie Bot" })],
        components: []
      }).catch(() => {});
    });
  },
};