from pathlib import Path
p = Path('src/data/hsc/science/physics/2nd-paper/board-questions/year-wise/2024/chattogram.ts')
text = p.read_text(encoding='utf-8')
marker = "যে সকল প্লাজমিডে অ্যান্টিবায়োটিক প্রতিরোধী জিন থাকে, তাকে বলে—"
if marker not in text:
    raise SystemExit('Marker not found')
head = text.split(marker)[0].rstrip()
if head.endswith(','):
    head = head[:-1]
new_text = head + '\n];\nexport default questions;\n'
p.write_text(new_text, encoding='utf-8')
print('trimmed to', new_text.count('question:'), 'questions')
