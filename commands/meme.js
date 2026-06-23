const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");
const https = require("https");

const CAPTIONS = [
  "✨ Sparxie تقول: هذا أضحكني 😭",
  "🎭 *تصفق* ذا يستاهل standing ovation~",
  "💅 والله الـ anime community ما يخيب",
  "🌟 هههههه ذا كثير 😂",
  "💫 أرسل هذا لصاحبك بتموت من الضحك",
  "🎪 *Sparxie تضحك* لا لا هذا كثير 😂",
  "🌸 هذا أحسن شي شفته اليوم 😭✨",
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { "User-Agent": "SparxieBot/1.0" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchMeme() {
  const data = await httpsGet("https://waifu.pics/api/sfw/waifu");
  return data.url || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Sparxie تجيب صورة anime عشوائية 🎭"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const url = await fetchMeme();
      if (!url) return interaction.editReply({ content: "😭 ما لقيت شي، جرب بعد شوي~" });
      
      const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(caption)
        .setImage(url)
        .setFooter({ text: "✨ Sparxie Bot • Honkai: Star Rail" });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: "😭 ما لقيت شي، جرب بعد شوي~" });
    }
  },

  fetchMeme,
  CAPTIONS,
};