from pathlib import Path
base = Path('src/data/hsc/science/physics/2nd-paper/board-questions/year-wise/2024')
for p in sorted(base.glob('*.ts')):
    txt = p.read_text(encoding='utf-8')
    print(p.name, txt.count('correctOptionIndex:'), len(txt.splitlines()))
