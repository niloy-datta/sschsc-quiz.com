from pathlib import Path
import sys
p = Path(sys.argv[1])
text = p.read_text(encoding='utf-8')
parts = text.split('question: ')[1:]
print(p.name, 'questions=', len(parts))
for i, part in enumerate(parts[-8:], start=len(parts)-7):
    print(i, part.split('\n', 1)[0].strip())
