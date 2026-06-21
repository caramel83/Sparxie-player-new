const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { CHARACTERS } = require("../data/characters");
const { addPoints } = require("../scoresManager");
const { RED } = require("../gameLauncher");
const { randomFrom } = require("../utils");

// تخزين مباريات البتل النشطة
const battles = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("تحدي لاعب ثاني في أسئلة HSR!")
    .addUserOption(opt =>
      opt.setName("الخصم").setDescription("اللاعب اللي تبي تتحداه").setRequired(true)
    ),

  battles,

  async execute(interaction) {
    const opponent = interaction.options.getUser("الخصم");
    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ content: "⚠️ اختار لاعب ثاني صح!", ephemeral: true });
    }

    const battleId = Math.random().toString(36).substring(2, 8);
    battles.set(battleId, {
      players: [interaction.user.id, opponent.id],
      scores: { [interaction.user.id]: 0, [opponent.id]: 0 },
      usernames: {
        [interaction.user.id]: interaction.user.username,
        [opponent.id]: opponent.username,
      },
      round: 0,
      maxRounds: 5,
      active: true,
    });

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle("⚔️ تحدي HSR!")
      .setDescription(
        `<@${interaction.user.id}> يتحدى <@${opponent.id}>!\n\n5 أسئلة — أول وحد يفوز بالأكثر يحصل **+20 نقطة**!`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_accept_${battleId}`)
        .setLabel("✅ أقبل التحدي")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`battle_reject_${battleId}`)
        .setLabel("❌ أرفض")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};

// دالة تطلق سؤال جديد للبتل
async function sendBattleQuestion(channel, battleId, battle) {
  const character = randomFrom(CHARACTERS);
  const options = [character.element, character.path, "⭐".repeat(character.rarity)];

  // نختار نوع السؤال
  const qTypes = ["element", "path", "rarity"];
  const qType = randomFrom(qTypes);

  let questionText, correctAnswer;
  if (qType === "element") {
    questionText = `ما عنصر **${character.name}**؟`;
    correctAnswer = character.element;
  } else if (qType === "path") {
    questionText = `ما مسار **${character.name}**؟`;
    correctAnswer = character.path;
  } else {
    questionText = `ما ندرة **${character.name}**؟`;
    correctAnswer = `${character.rarity}⭐`;
  }

  battle.currentQuestion = { characterName: character.name, answer: correctAnswer, qType, character };
  battle.answered = new Set();

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle(`⚔️ السؤال رقم ${battle.round + 1} من ${battle.maxRounds}`)
    .setDescription(questionText)
    .addFields(
      { name: `${battle.usernames[battle.players[0]]}`, value: `${battle.scores[battle.players[0]]} نقطة`, inline: true },
      { name: `${battle.usernames[battle.players[1]]}`, value: `${battle.scores[battle.players[1]]} نقطة`, inline: true }
    )
    .setFooter({ text: "اكتب الجواب بالشات!" });

  await channel.send({ embeds: [embed] });
}

module.exports.sendBattleQuestion = sendBattleQuestion;
