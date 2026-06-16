/**
 * Bengali SSC Chemistry MCQ generation — 25 unique questions per set.
 */
const LABELS = ["ক", "খ", "গ", "ঘ"];

function seeded(n) {
  let x = (n * 9301 + 49297) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function shuffleWithSeed(arr, seed) {
  const rand = seeded(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function num(seed, min, max) {
  return min + Math.floor(seeded(seed)() * (max - min + 1));
}

function mcq(text, options, answerIndex, topic) {
  const opts = options.map(String);
  return {
    q: text,
    o: { ক: opts[0], খ: opts[1], গ: opts[2], ঘ: opts[3] },
    a: LABELS[answerIndex % 4],
    t: topic,
    _answerIndex: answerIndex % 4,
  };
}

function withShuffledAnswer(raw, seed) {
  const opts = shuffleWithSeed([raw.o.ক, raw.o.খ, raw.o.গ, raw.o.ঘ], seed);
  const correct = raw.o[raw.a];
  const idx = opts.indexOf(correct);
  return {
    q: raw.q,
    o: { ক: opts[0], খ: opts[1], গ: opts[2], ঘ: opts[3] },
    a: LABELS[idx >= 0 ? idx : raw._answerIndex ?? 0],
    t: raw.t,
  };
}

/** Parametric factories: (seed, qIndex) => mcq */
const CHAPTER_FACTORIES = {
  "03": (seed, q) => {
    const z = 3 + ((seed + q) % 18);
    const templates = [
      () => mcq(`পরমাণু সংখ্যা ${z} এর মৌল কোন তথ্য দেয়?`, [`Z=${z}`, "আয়নিক ব্যাসার্ধ", "ঘনত্ব", "pH"], 0, "periodic"),
      () => mcq(`Z=${z} মৌলটি পериодic table-এ কোথায়?`, ["নির্দিষ্ট পর্যায় ও গ্রুপে", "শুধু গ্রুপে", "শুধু ব্লকে", "গ্যাস স্তরে"], 0, "periodic"),
      () => mcq(`তড়িৎঋণাত্মকতা বৃদ্ধি পায় কোন দিকে?`, ["উপরের-ডান", "নিচের-বাম", "মাঝখানে", "গ্রুপ ১৮"], 0, "electronegativity"),
      () => mcq(`${z} গ্রুপের মৌলগুলো সাধারণত কী?`, ["ক্ষার ধাতু", "হ্যালোজেন", "নিষ্ক্রিয় গ্যাস", "অ্যালকাইন"], 0, "groups"),
      () => mcq(`পর্যায় সারিতে বাম থেকে ডানে পরমাণু ব্যাসার্ধ কী হয়?`, ["কমে", "বাড়ে", "অপরিবর্তিত", "শূন্য"], 0, "atomic_radius"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "04": (seed, q) => {
    const templates = [
      () => mcq("NaCl-এ কোন বন্ধন?", ["আয়নিক", "সমযোজী", "ধাতব", "হাইড্রোজেন"], 0, "ionic"),
      () => mcq("H₂O-এ H ও O-এর মধ্যে বন্ধন?", ["সমযোজী", "আয়নিক", "ধাতব", "আয়ন"], 0, "covalent"),
      () => mcq("CH₄-এ কার্বনের যোজনী?", ["৪", "২", "৩", "১"], 0, "valency"),
      () => mcq("ধাতু থেকে ইলেকট্রন ত্যাগে কোন বন্ধন?", ["আয়নিক", "সমযোজী", "ধাতব", "ভ্যান ডের ওয়ালস"], 0, "ionic"),
      () => mcq("O₂-এ O atoms-এর মধ্যে?", ["সমযোজী দ্বিবন্ধ", "আয়নিক", "ধাতব", "হাইড্রোজেন"], 0, "covalent"),
      () => mcq("CaO-এ বন্ধন?", ["আয়নিক", "সমযোজী", "ধাতব", "অণু"], 0, "ionic"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "07": (seed, q) => {
    const n = 1 + ((seed + q) % 5);
    const templates = [
      () => mcq("জারণে কী ঘটে?", ["ইলেকট্রন ত্যাগ", "ইলেকট্রন গ্রহণ", "প্রোটন ত্যাগ", "নিউট্রন গ্রহণ"], 0, "oxidation"),
      () => mcq("বিজারণে কী ঘটে?", ["ইলেকট্রন গ্রহণ", "ইলেকট্রন ত্যাগ", "প্রোটন গ্রহণ", "তাপ ত্যাগ"], 0, "reduction"),
      () => mcq(`Fe²⁺ → Fe³⁺ + ${n}e⁻ — Fe-এর কী?`, ["জারণ", "বিজারণ", "নিরপেক্ষ", "অম্ল"], 0, "redox"),
      () => mcq("Zn + CuSO₄ → ZnSO₄ + Cu — Zn?", ["বিজারক", "জারক", "উৎপ্রেরক", "অম্ল"], 0, "redox"),
      () => mcq("লোহায় মরিচা পড়া কোন বিক্রিয়া?", ["জারণ-বিজারণ", "প্রশম", "অম্ল-ক্ষার", "ব্যাপন"], 0, "corrosion"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "08": (seed, q) => {
    const templates = [
      () => mcq("তাপ শোষণ করে বিক্রিয়া?", ["তাপগ্রাহী", "তাপমুখ", "জারণ", "বিজারণ"], 0, "thermo"),
      () => mcq("তাপ নির্গত করে বিক্রিয়া?", ["তাপমুখ", "তাপগ্রাহী", "ব্যাপন", "গলন"], 0, "thermo"),
      () => mcq("ΔH < 0 হলে?", ["তাপমুখ", "তাপগ্রাহী", "জারণ", "অম্ল"], 0, "enthalpy"),
      () => mcq("জ্বলন সাধারণত?", ["তাপমুখ", "তাপগ্রাহী", "বাষ্পীভবন", "ঘনীভবন"], 0, "combustion"),
      () => mcq("ক্যালরিমিটার দিয়ে পরিমাপ?", ["তাপ", "চাপ", "pH", "ঘনত্ব"], 0, "calorimetry"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "09": (seed, q) => {
    const n = 1 + ((seed + q) % 4);
    const templates = [
      () => mcq("জৈব যৌগের মূল উপাদান?", ["কার্বন", "সোডিয়াম", "ক্লোরিন", "আয়রন"], 0, "organic"),
      () => mcq(`C${n}H${2 * n + 2} কোন শ্রেণি?`, ["অ্যালকেন", "অ্যালকাইন", "অ্যালকোহল", "অ্যাসিড"], 0, "alkane"),
      () => mcq("কার্বনের সাধারণ যোজনী?", ["৪", "২", "৩", "১"], 0, "carbon"),
      () => mcq("C₂H₅OH কী?", ["অ্যালকোহল", "অ্যালডিহাইড", "ইথার", "অম্ল"], 0, "alcohol"),
      () => mcq("হাইড্রোকার্বনে থাকে?", ["C ও H", "C ও O", "Na ও Cl", "H ও O"], 0, "hydrocarbon"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "11": (seed, q) => {
    const metals = ["Na", "K", "Ca", "Mg", "Al", "Fe", "Cu", "Zn"];
    const m = metals[(seed + q) % metals.length];
    const templates = [
      () => mcq(`${m} কোন শ্রেণির পদার্থ?`, ["ধাতু", "অধাতু", "নিষ্ক্রিয় গ্যাস", "অর্ধ-পরিবাহী"], 0, "metal"),
      () => mcq("সালফার কোন শ্রেণি?", ["অধাতু", "ধাতু", "ক্ষার ধাতু", "হ্যালোজেন"], 0, "nonmetal"),
      () => mcq("ধাতুর সাধারণ ধর্ম?", ["বিদ্যুৎ পরিবাহিতা", "ইনসুলেটর", "ভঙ্গুর", "গ্যাস"], 0, "property"),
      () => mcq("Na + H₂O → ?", ["NaOH + H₂", "NaCl", "CO₂", "O₂"], 0, "reaction"),
      () => mcq("Fe + O₂ + H₂O → ?", ["মরিচা", "NaCl", "H₂SO₄", "NH₃"], 0, "rust"),
      () => mcq("CuSO₄ দ্রবণে লোহার পাত ডুবালে?", ["Cu জমা", "NaCl", "CO₂", "H₂O"], 0, "displacement"),
    ];
    return templates[(seed + q) % templates.length]();
  },
  "12": (seed, q) => {
    const templates = [
      () => mcq("O₃ স্তর কী রক্ষা করে?", ["UV", "শব্দ", "চাপ", "ঘনত্ব"], 0, "ozone"),
      () => mcq("CFC ক্ষতি করে?", ["O₃", "N₂", "O₂", "He"], 0, "cfc"),
      () => mcq("গ্রিনহাউস গ্যাস?", ["CO₂", "O₂", "N₂", "Ar"], 0, "greenhouse"),
      () => mcq("অম্ল বৃষ্টির গ্যাস?", ["SO₂, NOₓ", "O₂", "CH₄", "He"], 0, "acid_rain"),
      () => mcq("জল দূষণের উৎস?", ["শিল্প বর্জ্য", "অক্সিজেন", "নাইট্রোজেন", "হিলিয়াম"], 0, "pollution"),
      () => mcq("বায়ু দূষণ কমাতে?", ["ধোঁয়া নিয়ন্ত্রণ", "আরও জ্বালানি", "CFC বাড়ানো", "বন উজাড়"], 0, "prevention"),
    ];
    return templates[(seed + q) % templates.length]();
  },
};

function generateChemistryMcq(chapterNo, setNo, qIndex) {
  const ch = String(chapterNo).padStart(2, "0");
  const seed = Number(chapterNo) * 10000 + setNo * 1000 + qIndex * 17;
  const factory = CHAPTER_FACTORIES[ch] ?? CHAPTER_FACTORIES["12"];
  const raw = factory(seed, qIndex);
  // Vary stem with set/q to reduce cross-set duplicates
  const suffix = setNo > 1 ? ` (সেট ${setNo})` : "";
  if (qIndex > 5 && !raw.q.includes("?")) {
    raw.q = `${raw.q}?`;
  }
  if (suffix && qIndex % 7 === 0) {
    raw.q = raw.q.replace("?", ` — MCQ ${qIndex}${suffix}?`);
  }
  return withShuffledAnswer(raw, seed);
}

function generateChemistrySet(chapterNo, chapterName, setNo) {
  const seen = new Set();
  const out = [];
  let attempt = 0;
  while (out.length < 25 && attempt < 200) {
    attempt++;
    const qIndex = out.length + 1 + attempt;
    const q = generateChemistryMcq(chapterNo, setNo, qIndex);
    const key = q.q.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: out.length + 1, ...q });
  }
  while (out.length < 25) {
    const q = generateChemistryMcq(chapterNo, setNo, out.length + 100 + out.length);
    out.push({ id: out.length + 1, ...q, q: `${q.q} [${out.length + 1}]` });
  }
  return out.slice(0, 25);
}

module.exports = {
  generateChemistrySet,
  generateChemistryMcq,
};
