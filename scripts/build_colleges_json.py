"""Build backend/data/colleges.json from backend/data/college_names.txt (one name per line)."""
import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES_FILE = ROOT / "backend" / "data" / "college_names.txt"
OUT_FILE = ROOT / "backend" / "data" / "colleges.json"


def eiin_for(name: str, idx: int) -> str:
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:5]
    return str(100000 + (int(digest, 16) % 899900))


def main() -> None:
    if not NAMES_FILE.is_file():
        raise SystemExit(f"Missing {NAMES_FILE}")

    seen: set[str] = set()
    colleges: list[dict] = []
    for idx, line in enumerate(NAMES_FILE.read_text(encoding="utf-8").splitlines()):
        name = line.strip()
        if not name:
            continue
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        colleges.append({"eiin": eiin_for(name, idx), "name": name})

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(colleges, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(colleges)} colleges to {OUT_FILE}")


if __name__ == "__main__":
    main()
