const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

// تخزين حالة كل لعبة إكس أو شغالة (key = message ID بعد الإرسال)
const xoGames = new Map();

function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

function buildBoard(board, gameId, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`xo_${gameId}_${idx}`)
          .setLabel(cell ? cell : "‎ ")
          .setStyle(
            cell === "X"
              ? ButtonStyle.Danger
              : cell === "O"
              ? ButtonStyle.Primary
              : ButtonStyle.Secondary
          )
          .setDisabled(disabled || cell !== null)
      );
    }
    rows.push(row);
  }
  return rows;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xo")
    .setDescription("تحدى صاحبك بلعبة إكس أو! ❌⭕")
    .addUserOption((option) =>
      option
        .setName("الخصم")
        .setDescription("منو تبي تلعب معه؟")
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser("الخصم");
    const player1 = interaction.user;

    if (opponent.id === player1.id) {
      await interaction.reply({
        content: "❌ ما تقدر تلعب مع نفسك!",
        ephemeral: true,
      });
      return;
    }
    if (opponent.bot) {
      await interaction.reply({
        content: "❌ ما تقدر تلعب مع بوت!",
        ephemeral: true,
      });
      return;
    }

    const gameId = `${interaction.id}`;
    const board = Array(9).fill(null);

    const gameState = {
      board,
      players: { X: player1.id, O: opponent.id },
      turn: "X",
    };
    xoGames.set(gameId, gameState);

    const embed = new EmbedBuilder()
      .setColor(0xe03131)
      .setTitle("❌⭕ لعبة إكس أو")
      .setDescription(
        `${player1.username} (❌) ضد ${opponent.username} (⭕)\nدور: **${player1.username}**`
      );

    await interaction.reply({
      embeds: [embed],
      components: buildBoard(board, gameId),
    });
  },

  // دالة مساعدة تستخدمها index.js عند الضغط على الأزرار
  xoGames,
  checkWinner,
  buildBoard,
};
