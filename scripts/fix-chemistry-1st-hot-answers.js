/**
 * Fix known answer/explanation mismatches in chemistry 1st hot import sets.
 */
function fixSet(set) {
  const n = Number(set.setNumber);
  const q = (no) => set.questions.find((x) => Number(x.questionNumber) === no);

  if (n === 3) {
    const x = q(24);
    if (x) {
      x.correctOption = "খ";
      x.explanation =
        "N₂O₄ ⇌ 2NO₂; 0.5 mol থেকে 20% বিয়োজন → N₂O₄ 0.4 M, NO₂ 0.2 M; Kc = 0.2²/0.4 = 0.10।";
    }
  }

  if (n === 4) {
    const x2 = q(2);
    if (x2) {
      x2.correctOption = "ঘ";
      x2.explanation =
        "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O। 5 g C₃H₈ = 5/44 mol → CO₂ = 3×(5/44)×44 = 15 g।";
    }
    const x4 = q(4);
    if (x4) {
      x4.correctOption = "গ";
      x4.explanation =
        "HCl যোগে [CH₃COONa]=0.04, [CH₃COOH]=0.11; pH = 4.76 + log(0.04/0.11) ≈ 4.32 → নিকটতম 4.30 (গ)।";
    }
  }

  if (n === 7) {
    const x2 = q(2);
    if (x2) {
      x2.passage = "উদ্দীপকের গ্যাস A";
      x2.questionText =
        "গ্যাস A এর 0.1 M দ্রবণের pH প্রায়— (HF এর Ka = 6.8×10⁻⁴)";
      x2.explanation =
        "[H⁺] = √(Ka×C) ≈ 8.24×10⁻³ M → pH ≈ 2.08 ≈ 2.1 (খ)।";
    }
  }

  if (n === 8) {
    const x13 = q(13);
    if (x13) {
      x13.correctOption = "খ";
      x13.explanation =
        "HCl 0.1 mol, NaOH 0.1 mol → 0.1 mol পানি; তাপ = 57.3 × 0.1 = 5.73 kJ।";
    }
  }

  if (n === 9) {
    const x10 = q(10);
    if (x10) {
      x10.correctOption = "খ";
      x10.explanation =
        "AgNO₃ 2 mmol, NaCl 3 mmol → AgCl 2 mmol; অবশিষ্ট লবণ NaCl 0.01 mol।";
    }
  }

  if (n === 10) {
    const x1 = q(1);
    if (x1) {
      x1.correctOption = "খ";
      x1.explanation =
        "বাষ্প ঘনত্ব (H₂ সাপেক্ষে) 22 → M = 2×22 = 44 g/mol (CO₂/C₃H₈)।";
    }
    const x7 = q(7);
    if (x7) {
      x7.questionText =
        "2A + B ⇌ 2C; প্রারম্ভিক A=2 mol, B=1 mol, 1 L পাত্রে সাম্য C=1 mol। Kc কত?";
      x7.options = ["ক) 0.5", "খ) 1.0", "গ) 0.25", "ঘ) 2.0"];
      x7.correctOption = "ঘ";
      x7.explanation = "A=1 M, B=0.5 M, C=1 M; Kc = 1²/(1²×0.5) = 2.0।";
      x7.topic = "সাম্যাবস্থা (Kc)";
    }
  }

  return set;
}

module.exports = { fixSet };
