// commands/trivia.js
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const questions = [
  { q: "ما عاصمة اليابان؟", a: "طوكيو", choices: ["طوكيو", "أوساكا", "كيوتو", "ناغويا"] },
  { q: "كم عدد لاعبي كرة القدم لكل فريق؟", a: "11", choices: ["9", "10", "11", "12"] },
  { q: "من هو مخترع الهاتف؟", a: "غراهام بيل", choices: ["أديسون", "غراهام بيل", "تيسلا", "نيوتن"] },
  { q: "ما أكبر كوكب في المجموعة الشمسية؟", a: "المشتري", choices: ["زحل", "المشتري", "أورانوس", "نبتون"] },
  { q: "Sparxie تتبع أي Path في HSR؟", a: "Elation", choices: ["Harmony", "Elation", "Nihility", "Hunt"] },
  { q: "ما عنصر Sparxie في HSR؟", a: "Fire", choices: ["Ice", "Wind", "Fire", "Lightning"] },
];

module.exports = {
  data: new SlashCommandBuilder().setName("trivia").setDescription("سؤال ثقافي LIVE من Sparxie! 🧠"),
  async execute(interaction) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    const shuffled = [...q.choices].sort(() => Math.random() - 0.5);
    const row = new ActionRowBuilder().addComponents(
      shuffled.map(c => new ButtonBuilder().setCustomId(`trivia_${c}_${q.a}`).setLabel(c).setStyle(ButtonStyle.Primary))
    );
    const msg = await interaction.reply({
      embeds: [new EmbedBuilder().setColor(RED).setTitle("🧠 LIVE TRIVIA!").setDescription(`**${q.q}**`).setFooter({ text: "عندك 15 ثانية! ✨ Sparxie Bot" })],
      components: [row], fetchReply: true
    });
    const collector = msg.createMessageComponentCollector({ time: 15000 });
    collector.on("collect", async i => {
      const [, chosen, correct] = i.customId.split("_");
      const win = chosen === correct;
      await i.update({
        embeds: [new EmbedBuilder().setColor(win ? 0x00FF88 : RED).setTitle(win ? "✅ CORRECT! CLIP THAT!" : "❌ WRONG! L في الـ chat!").setDescription(`**${q.q}**\n\nالجواب: **${correct}**\n\n${win ? "Sparxie فخورة~ ✨" : "Sparxie محبطة منك 💀"}`).setFooter({ text: `${i.user.username} جاوب • ✨ Sparxie Bot` })],
        components: []
      });
      collector.stop();
    });
    collector.on("end", async (_, r) => { if (r === "time") await interaction.editReply({ components: [] }).catch(() => {}); });
  },
};