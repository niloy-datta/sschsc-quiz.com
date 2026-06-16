"""Audit question counts across ALL SSC subjects, ALL years, ALL boards."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ["physics", "chemistry", "biology", "general-math", "higher-math"]
BOARDS = ["barishal", "chattogram", "cumilla", "dhaka", "dinajpur", "jashore", "mymensingh", "rajshahi", "sylhet"]
YEARS = [2022, 2023, 2024, 2025, 2026]

# Header
print(f"\n{'='*90}")
print(f"{'SUBJECT':<18s} {'YEAR':>5s}  " + " ".join(f"{b:<12s}" for b in BOARDS))
print(f"{'='*90}")

for subj in SUBJECTS:
    for year in YEARS:
        row = [f"{subj:<18s} {year:>5d}  "]
        all_ok = True
        for board in BOARDS:
            fp = ROOT / "public" / "questions" / subj / f"{board}-{year}.json"
            if fp.exists():
                data = json.load(open(fp, encoding="utf-8"))
                n = len(data)
                if n >= 25:
                    row.append(f"{n:<12d}")
                else:
                    row.append(f"{n:<5d}(SHORT)   ".ljust(12))
                    all_ok = False
            else:
                row.append(f"{'MISSING':<12s}")
                all_ok = False
        print("".join(row))
    print()

print("=" * 90)
print("\nDONE.")
