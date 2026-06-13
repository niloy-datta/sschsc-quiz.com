from pathlib import Path
import json
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent))
from scripts.parse_hsc_biology_board_questions import parse_sections, parse_questions

question_path = Path('src/data/hsc/science/biology/2nd-paper/board-questions/year-wise/2022/question.txt')
text = question_path.read_text(encoding='utf-8')
sections = parse_sections(text)
board_names = [
    ('Dhaka Board','dhaka.ts'),
    ('Chattogram Board','chattogram.ts'),
    ('Cumilla Board','cumilla.ts'),
    ('Dinajpur Board','dinajpur.ts'),
    ('Rajshahi Board','rajshahi.ts'),
    ('Sylhet Board','sylhet.ts'),
    ('Barishal Board','barishal.ts'),
    ('Jashore Board','jashore.ts'),
    ('Mymensingh Board','mymensingh.ts'),
]
section_map = {}
for num,bangla,ename,start,end in sections:
    if ename not in section_map:
        section_map[ename] = (start,end)

out_dir = Path('src/data/hsc/science/biology/1st-paper/board-questions/year-wise/2023')
for display_name, filename in board_names:
    if display_name not in section_map:
        print('MISSING', display_name)
        continue
    start,end = section_map[display_name]
    section_text = text[start:end]
    qs = parse_questions(section_text, limit=25)
    output_path = out_dir / filename
    items = []
    for q in qs:
        items.append({
            'question': q['question'],
            'options': q['options'],
            'correctOptionIndex': q['correctOptionIndex'],
        })
    lines = ['export const questions = [']
    for item in items:
        qstr = json.dumps(item['question'], ensure_ascii=False)
        opts = ', '.join(json.dumps(opt, ensure_ascii=False) for opt in item['options'])
        lines.append('  {')
        lines.append(f'    question: {qstr},')
        lines.append(f'    options: [{opts}],')
        lines.append(f'    correctOptionIndex: {item["correctOptionIndex"]},')
        lines.append('  },')
    lines.append('];')
    lines.append('export default questions;')
    output_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('WROTE', output_path, len(items))

all_lines = [
    'import { questions as dhaka } from "./dhaka";',
    'import { questions as chattogram } from "./chattogram";',
    'import { questions as cumilla } from "./cumilla";',
    'import { questions as dinajpur } from "./dinajpur";',
    'import { questions as rajshahi } from "./rajshahi";',
    'import { questions as sylhet } from "./sylhet";',
    'import { questions as barishal } from "./barishal";',
    'import { questions as jashore } from "./jashore";',
    'import { questions as mymensingh } from "./mymensingh";',
    '',
    'export const questions = [',
    '  ...dhaka,',
    '  ...chattogram,',
    '  ...cumilla,',
    '  ...dinajpur,',
    '  ...rajshahi,',
    '  ...sylhet,',
    '  ...barishal,',
    '  ...jashore,',
    '  ...mymensingh,',
    '];',
    'export default questions;',
]
(Path('src/data/hsc/science/biology/1st-paper/board-questions/year-wise/2023/all-board.ts')).write_text('\n'.join(all_lines) + '\n', encoding='utf-8')
print('WROTE all-board.ts')
