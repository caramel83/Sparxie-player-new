const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { RED } = require("../gameLauncher");

const SUBREDDITS = ["HonkaiStarRail", "SparkleMains", "RobinMains", "TopazMains"];
const postedIds = new Set();

const CAPTIONS = [
  "✨ Sparxie تقول: هذا أضحكني أكثر من Peppy 😭",
  "🎭 *تصفق* ENCORE! ذا يستاهل standing ovation~",
  "💅 والله الـ HSR community ما يخيب أبداً",
  "🌟 هههههه ذا بالضبط اللي صار معي في الـ Simulated Universe",
  "🎪 *Sparxie تضحك بصوت عالي* لا لا هذا كثير 😂",
  "✨ الـ gacha players يفهمون هذا الألم 💀",
  "💫 أرسل هذا لـ Robin بتموت من الضحك",
  "🌸 هذا أحسن ميم شفته اليوم والله 😭✨",
];

async function fetchMeme() {
  const sub = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, {
    headers: { "User-Agent": "SparxieBot/1.0" },
  });
  const data = await res.json();
  const posts = data.data.children.filter(p => {
    const d = p.data;
    return !d.is_self && !d.over_18 && !postedIds.has(d.id) &&
      /\.(jpg|jpeg|png|gif|webp)$/.test(d.url);
  });

  if (!posts.length) return null;
  const chosen = posts[Math.floor(Math.random() * posts.length)].data;
  postedIds.add(chosen.id);
  if (postedIds.size > 200) {
    const arr = [...postedIds];
    arr.splice(0, 100).forEach(id => postedIds.delete(id));
  }
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
    .setDescription("Sparxie تجيب ميم HSR من Reddit 🎭"),

  async execute(interaction) {
    await interaction.deferReply();
    const meme = await fetchMeme();

    if (!meme) {
      return interaction.editReply({ content: "😭 *Sparxie محبطة* ما لقيت ميمات الحين، جرب بعد شوي~" });
    }

    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle(meme.title.slice(0, 200))
      .setURL(meme.permalink)
      .setDescription(`${caption}\n\n📊 **${meme.score.toLocaleString()}** upvotes • r/${meme.subreddit}`)
      .setImage(meme.url)
      .setFooter({ text: `✨ Sparxie Bot • u/${meme.author}` });

    await interaction.editReply({ embeds: [embed] });
  },

  fetchMeme,
  CAPTIONS,
};
