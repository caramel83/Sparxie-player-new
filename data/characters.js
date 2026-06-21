// قاعدة بيانات شخصيات Honkai: Star Rail
// كل شخصية: name, rarity (4 أو 5), element (العنصر), path (المسار)
// المسارات: Destruction, Hunt, Erudition, Harmony, Nihility, Preservation, Abundance, Remembrance

const CHARACTERS = [
  // ===== الإصدار 1.x =====
  { name: "Seele", rarity: 5, element: "Quantum", path: "Hunt" },
  { name: "Jing Yuan", rarity: 5, element: "Lightning", path: "Erudition" },
  { name: "Silver Wolf", rarity: 5, element: "Quantum", path: "Nihility" },
  { name: "Luocha", rarity: 5, element: "Imaginary", path: "Abundance" },
  { name: "Blade", rarity: 5, element: "Wind", path: "Destruction" },
  { name: "Kafka", rarity: 5, element: "Lightning", path: "Nihility" },
  { name: "Dan Heng - Imbibitor Lunae", rarity: 5, element: "Imaginary", path: "Destruction" },
  { name: "Fu Xuan", rarity: 5, element: "Quantum", path: "Preservation" },
  { name: "Jingliu", rarity: 5, element: "Ice", path: "Destruction" },
  { name: "Topaz & Numby", rarity: 5, element: "Fire", path: "Hunt" },
  { name: "Huohuo", rarity: 5, element: "Wind", path: "Abundance" },
  { name: "Argenti", rarity: 5, element: "Physical", path: "Erudition" },
  { name: "Ruan Mei", rarity: 5, element: "Ice", path: "Harmony" },
  { name: "Dr. Ratio", rarity: 5, element: "Imaginary", path: "Hunt" },

  // ===== الشخصيات القياسية (Standard) =====
  { name: "Himeko", rarity: 5, element: "Fire", path: "Erudition" },
  { name: "Welt", rarity: 5, element: "Imaginary", path: "Nihility" },
  { name: "Bronya", rarity: 5, element: "Wind", path: "Harmony" },
  { name: "Gepard", rarity: 5, element: "Ice", path: "Preservation" },
  { name: "Clara", rarity: 5, element: "Physical", path: "Destruction" },
  { name: "Yanqing", rarity: 5, element: "Ice", path: "Hunt" },
  { name: "Bailu", rarity: 5, element: "Lightning", path: "Abundance" },

  // ===== الإصدار 2.x =====
  { name: "Black Swan", rarity: 5, element: "Wind", path: "Nihility" },
  { name: "Sparkle", rarity: 5, element: "Quantum", path: "Harmony" },
  { name: "Acheron", rarity: 5, element: "Lightning", path: "Nihility" },
  { name: "Aventurine", rarity: 5, element: "Imaginary", path: "Preservation" },
  { name: "Robin", rarity: 5, element: "Physical", path: "Harmony" },
  { name: "Boothill", rarity: 5, element: "Physical", path: "Hunt" },
  { name: "Firefly", rarity: 5, element: "Fire", path: "Destruction" },
  { name: "Jade", rarity: 5, element: "Quantum", path: "Erudition" },
  { name: "Yunli", rarity: 5, element: "Physical", path: "Destruction" },
  { name: "Jiaoqiu", rarity: 5, element: "Fire", path: "Nihility" },
  { name: "Feixiao", rarity: 5, element: "Wind", path: "Hunt" },
  { name: "Lingsha", rarity: 5, element: "Fire", path: "Abundance" },
  { name: "Rappa", rarity: 5, element: "Imaginary", path: "Destruction" },
  { name: "Sunday", rarity: 5, element: "Imaginary", path: "Harmony" },
  { name: "Fugue", rarity: 5, element: "Fire", path: "Destruction" },

  // ===== الإصدار 3.x =====
  { name: "Aglaea", rarity: 5, element: "Lightning", path: "Remembrance" },
  { name: "The Herta", rarity: 5, element: "Ice", path: "Erudition" },
  { name: "Tribbie", rarity: 5, element: "Quantum", path: "Harmony" },
  { name: "Mydei", rarity: 5, element: "Imaginary", path: "Destruction" },
  { name: "Castorice", rarity: 5, element: "Quantum", path: "Remembrance" },
  { name: "Anaxa", rarity: 5, element: "Wind", path: "Erudition" },
  { name: "Hyacine", rarity: 5, element: "Wind", path: "Abundance" },
  { name: "Cipher", rarity: 5, element: "Quantum", path: "Nihility" },
  { name: "Phainon", rarity: 5, element: "Physical", path: "Destruction" },
  { name: "Saber", rarity: 5, element: "Wind", path: "Destruction" },
  { name: "Archer", rarity: 5, element: "Quantum", path: "Hunt" },
  { name: "Hysilens", rarity: 5, element: "Physical", path: "Nihility" },
  { name: "Cerydra", rarity: 5, element: "Wind", path: "Remembrance" },
  { name: "Evernight", rarity: 5, element: "Ice", path: "Nihility" },
  { name: "Cyrene", rarity: 5, element: "Ice", path: "Abundance" },

  // ===== الإصدار 4.x =====
  { name: "Ashveil", rarity: 5, element: "Lightning", path: "Hunt" },
  { name: "Yao Guang", rarity: 5, element: "Physical", path: "Remembrance" },
  { name: "Silver Wolf Lv.999", rarity: 5, element: "Imaginary", path: "Elation" },
  { name: "Evanescia", rarity: 5, element: "Physical", path: "Elation" },
  { name: "Mortenax Blade", rarity: 5, element: "Fire", path: "Nihility" },

  // ===== الشخصيات الخاسرة بالـ 50/50 (القياسية أيضاً، مكررة هنا للوضوح بالكود) =====
  // ملاحظة: نفس السبع الموجودين أعلاه بقسم "القياسية"
];

// السبع شخصيات اللي يخسر فيهم اللاعب بـ 50/50 (Standard banner)
const STANDARD_LOSE_POOL = [
  "Himeko",
  "Welt",
  "Bronya",
  "Gepard",
  "Clara",
  "Yanqing",
  "Bailu",
];

module.exports = { CHARACTERS, STANDARD_LOSE_POOL };
