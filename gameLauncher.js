// مشغّل الألعاب المركزي - يطلق أي لعبة مع أزرار التحكم
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { setActiveGame } = require("./gameManager");
const { CHARACTERS } = require("./data/characters");
const SCRAMBLE_WORDS = require("./data/scramble_words");
const { shuffleWord, randomFrom } = require("./utils");

const RED = 0xe03131;

// أزرار التحكم الموحدة
function controlButtons(gameId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`skip_${gameId}`)
      .setLabel("⏭️ تخطي")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stop_${gameId}`)
      .setLabel("⏹️ إيقاف")
      .setStyle(ButtonStyle.Danger)
  );
}

// أزرار الإجابة للعبة الـ guess (نعم/لا)
function yesNoButtons(gameId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ans_yes_${gameId}`)
      .setLabel("نعم ✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ans_no_${gameId}`)
      .setLabel("لا ❌")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`skip_${gameId}`)
      .setLabel("⏭️ تخطي")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stop_${gameId}`)
      .setLabel("⏹️ إيقاف")
      .setStyle(ButtonStyle.Danger)
  );
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 8);
}

// لعبة تخمين الشخصية
async function launchGuess(channel) {
  const character = randomFrom(CHARACTERS);
  const gameId = generateGameId();

  // نختار سؤالاً عشوائياً من عدة أنواع
  const questionTypes = ["gender", "rarity5", "element", "path"];
  const qType = randomFrom(questionTypes);

  let question, answer;

  const femaleNames = [
    "Seele","Silver Wolf","Fu Xuan","Jingliu","Topaz & Numby","Huohuo",
    "Ruan Mei","Himeko","Bronya","Clara","Bailu","Black Swan","Sparkle",
    "Acheron","Robin","Firefly","Jade","Yunli","Lingsha","Rappa","Fugue",
    "Aglaea","The Herta","Tribbie","Castorice","Hyacine","Cipher","Cerydra",
    "Evernight","Cyrene","Kafka",
  ];

  if (qType === "gender") {
    const isFemale = femaleNames.includes(character.name);
    question = `هل الشخصية **${character.name}** أنثى؟`;
    answer = isFemale ? "yes" : "no";
  } else if (qType === "rarity5") {
    question = `هل الشخصية **${character.name}** من ندرة ⭐⭐⭐⭐⭐ (5 نجوم)؟`;
    answer = character.rarity === 5 ? "yes" : "no";
  } else if (qType === "element") {
    const elements = ["Fire","Ice","Wind","Lightning","Quantum","Imaginary","Physical"];
    const fakeEl = randomFrom(elements.filter(e => e !== character.element));
    const correctEl = character.element;
    const shown = Math.random() < 0.5 ? correctEl : fakeEl;
    answer = shown === correctEl ? "yes" : "no";
    question = `هل عنصر **${character.name}** هو ${shown}؟`;
  } else {
    const paths = ["Destruction","Hunt","Erudition","Harmony","Nihility","Preservation","Abundance","Remembrance","Elation"];
    const fakePath = randomFrom(paths.filter(p => p !== character.path));
    const correctPath = character.path;
    const shown = Math.random() < 0.5 ? correctPath : fakePath;
    answer = shown === correctPath ? "yes" : "no";
    question = `هل مسار **${character.name}** هو ${shown}؟`;
  }

  setActiveGame(channel.id, {
    type: "guess_yesno",
    gameId,
    question,
    answer,
    characterName: character.name,
  });

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle("🔍 سؤال HSR!")
    .setDescription(question)
    .setFooter({ text: "اضغط نعم أو لا!" });

  await channel.send({ embeds: [embed], components: [yesNoButtons(gameId)] });
}

// لعبة رتب الكلمة
async function launchScramble(channel) {
  const word = randomFrom(SCRAMBLE_WORDS);
  const scrambled = shuffleWord(word);
  const gameId = generateGameId();

  setActiveGame(channel.id, {
    type: "scramble",
    gameId,
    answer: word,
  });

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle("🔤 رتب الكلمة!")
    .setDescription(`الكلمة المبعثرة:\n## ${scrambled.split("").join(" ")}`)
    .setFooter({ text: "اكتب الكلمة الصحيحة بالشات! 🏆 +10 نقاط" });

  await channel.send({ embeds: [embed], components: [controlButtons(gameId)] });
}

// لعبة خمن الشخصية بالتلميحات (نصية)
async function launchHSRGuess(channel) {
  const character = randomFrom(CHARACTERS);
  const gameId = generateGameId();

  setActiveGame(channel.id, {
    type: "hsr_guess",
    gameId,
    answer: character.name,
  });

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle("🎮 خمن الشخصية!")
    .setDescription("من هذي الشخصية من Honkai: Star Rail؟")
    .addFields(
      { name: "الندرة", value: "⭐".repeat(character.rarity), inline: true },
      { name: "العنصر", value: character.element, inline: true },
      { name: "المسار", value: character.path, inline: true }
    )
    .setFooter({ text: "اكتب اسم الشخصية بالشات! 🏆 +15 نقاط" });

  await channel.send({ embeds: [embed], components: [controlButtons(gameId)] });
}

// اختيار لعبة عشوائية
async function launchRandom(channel) {
  const games = [launchHSRGuess, launchScramble, launchGuess];
  const chosen = randomFrom(games);
  await chosen(channel);
}

module.exports = { launchRandom, launchHSRGuess, launchScramble, launchGuess, generateGameId, RED };
