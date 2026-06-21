function shuffleWord(word) {
  let letters = word.split("");
  let scrambled = word;
  let attempts = 0;
  while (scrambled === word && attempts < 10) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    scrambled = letters.join("");
    attempts++;
  }
  return scrambled;
}

function normalizeArabic(text) {
  return text
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { shuffleWord, normalizeArabic, randomFrom };
