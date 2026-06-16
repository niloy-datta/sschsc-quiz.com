"""Extract college names from agent transcript user query and build colleges.json."""
import json
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path(
    r"C:\Users\Niloy Chandra\.cursor\projects\c-Users-Niloy-Chandra-Documents-dev-quiz-dashboard\agent-transcripts\abf28555-993a-4387-9601-d4c5cb6c0a2a\abf28555-993a-4387-9601-d4c5cb6c0a2a.jsonl"
)
NAMES_FILE = ROOT / "backend" / "data" / "college_names.txt"
OUT_FILE = ROOT / "backend" / "data" / "colleges.json"


def eiin_for(name: str) -> str:
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:5]
    return str(100000 + (int(digest, 16) % 899900))


def extract_names(text: str) -> list[str]:
    match = re.search(r'all college name (\[.*?\])\s+scholname', text, re.DOTALL)
    if not match:
        match = re.search(r'all college name (\[.*\])', text, re.DOTALL)
    if not match:
        raise ValueError("Could not find college name array in transcript")
    return json.loads(match.group(1))


def main() -> None:
    names: list[str] = []
    with TRANSCRIPT.open(encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            if row.get("role") != "user":
                continue
            content = row.get("message", {}).get("content", [])
            for block in content:
                if block.get("type") != "text":
                    continue
                text = block.get("text", "")
                if "all college name" in text and "UTTAR SONAKHALI" in text:
                    names = extract_names(text)
                    break
            if names:
                break

    if not names:
        raise SystemExit("No names extracted")

    seen: set[str] = set()
    unique: list[str] = []
    for name in names:
        n = name.strip()
        if not n:
            continue
        key = n.casefold()
        if key in seen:
            continue
        seen.add(key)
        unique.append(n)

    NAMES_FILE.parent.mkdir(parents=True, exist_ok=True)
    NAMES_FILE.write_text("\n".join(unique), encoding="utf-8")

    colleges = [{"eiin": eiin_for(n), "name": n} for n in unique]
    OUT_FILE.write_text(json.dumps(colleges, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(unique)} unique colleges -> {OUT_FILE}")


if __name__ == "__main__":
    main()
