import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from scripts.parse_hsc_biology_board_questions import parse_sections, parse_questions

with open('src/data/hsc/science/biology/2nd-paper/board-questions/year-wise/2022/question.txt', encoding='utf-8') as f:
    text = f.read()

board_names = ['Dhaka Board','Chattogram Board','Cumilla Board','Dinajpur Board','Rajshahi Board','Sylhet Board','Barishal Board','Jashore Board','Mymensingh Board']
for num,bangla,ename,start,end in parse_sections(text):
    if ename in board_names:
        section = text[start:end]
        qs = parse_questions(section, limit=25)
        print(ename, len(qs))
        print('  q1', qs[0]['question'][:80].replace('\n',' '), qs[0]['options'], qs[0]['correctOptionIndex'])
        print('  qlast', qs[-1]['question'][:80].replace('\n',' '), qs[-1]['options'], qs[-1]['correctOptionIndex'])
