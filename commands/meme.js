const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");
const https = require("https");

const SUBREDDITS = ["Animemes", "anime_irl", "goodanimemes"];
const postedIds = new Set();

const CAPTIONS = [
  "✨ Sparxie تقول: هذا أضحكني 😭",
  "🎭 *تصفق* ذا يستاهل standing ovation~",
  "💅 والله الـ anime community ما يخيب",
  "🌟 هههههه ذا كثير 😂",
  "💫 أرسل هذا لصاحبك بتموت من الضحك",
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 SparxieBot/1.0",
        "Accept": "application/json",
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpsGet(res.headers.location));
      }
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
  const sub = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
  const data = await httpsGet(`https://www.reddit.com/r/${sub}/hot.json?limit=25`);
  const posts = data.data.children.filter(p => {
    const d = p.data;
    return !d.is_self && !d.over_18 && !postedIds.has(d.id) &&
      /\.(jpg|jpeg|png|gif)$/i.test(d.url);
  });
  if (!posts.length) return null;
  const chosen = posts[Math.floor(Math.random() * posts.length)].data;
  postedIds.add(chosen.id);
  return {
    title: chosen.title,
    url: chosen.url,
    subreddit: chosen.subreddit,
    score: chosen.score,
    permalink: `https://reddit.com${chosen.permalink}`,
    author: chosen.author,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Sparxie تجيب ميم عشوائي 🎭"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const meme = await fetchMeme();
      if (!meme) return interaction.editReply({ content: "😭 ما لقيت ميمات الحين، جرب بعد شوي~" });
      const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle(meme.title.slice(0, 200))
        .setURL(meme.permalink)
        .setDescription(`${caption}\n\n📊 **${meme.score.toLocaleString()}** upvotes • r/${meme.subreddit}`)
        .setImage(meme.url)
        .setFooter({ text: `✨ Sparxie Bot • u/${meme.author}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: "😭 ما لقيت ميمات الحين، جرب بعد شوي~" });
    }
  },

  fetchMeme,
  CAPTIONS,
};