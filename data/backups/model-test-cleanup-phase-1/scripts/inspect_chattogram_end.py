from pathlib import Path
text = Path('src/data/hsc/science/physics/2nd-paper/board-questions/year-wise/2024/chattogram.ts').read_text(encoding='utf-8')
parts = text.split('question: ')[1:]
for i, part in enumerate(parts[-12:], start=len(parts)-11):
    question = part.split('\n', 1)[0].strip()
    print(i, question)
