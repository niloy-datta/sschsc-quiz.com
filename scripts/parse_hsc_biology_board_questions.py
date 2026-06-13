import re
import sys
from pathlib import Path
import json

def parse_sections(text):
    board_pattern = re.compile(r'^### \*\*(\d+)\. ([^\(]+) \(([^)]+)\)\*\*', flags=re.MULTILINE)
    plain_pattern = re.compile(r'^(?:[০১২৩৪৫৬৭৮৯]+[।\.]\s*)?([^\(]+ বোর্ড) \(([^)]+)\)', flags=re.MULTILINE)

    markdown_sections = [
        (m.group(1), m.group(2).strip(), m.group(3).strip(), m.start(), m.end())
        for m in board_pattern.finditer(text)
    ]
    plain_sections = [
        (m.group(1).strip(), m.group(2).strip(), m.start(), m.end())
        for m in plain_pattern.finditer(text)
    ]

    sections = []
    for i, (num, bangla, ename, start, end) in enumerate(markdown_sections):
        next_md_start = markdown_sections[i+1][3] if i+1 < len(markdown_sections) else None
        next_plain_starts = [pstart for (_, _, pstart, _) in plain_sections if pstart > end]
        next_plain_start = min(next_plain_starts) if next_plain_starts else None
        section_end_candidates = [x for x in (next_md_start, next_plain_start, len(text)) if x is not None]
        section_end = min(section_end_candidates)
        sections.append((num, bangla, ename, start, section_end))
    return sections


def parse_questions(body, limit=None):
    num_re = re.compile(r'(^[০১২৩৪৫৬৭৮৯]+)।', flags=re.MULTILINE)
    answer_re = re.compile(r'\*\*\((ক|খ|গ|ঘ)\)')
    option_marker = re.compile(r'\((?:ক|খ|গ|ঘ)\)\s*')

    starts = [m.start() for m in num_re.finditer(body) if m.start() == 0 or body[m.start()-1] == '\n']
    if limit is not None:
        starts = starts[:limit]

    def extract_options(raw):
        opts = []
        matches = list(option_marker.finditer(raw))
        for idx, match in enumerate(matches):
            start = match.end()
            end = matches[idx+1].start() if idx+1 < len(matches) else len(raw)
            opt = raw[start:end].strip()
            if idx == len(matches) - 1:
                opt = re.split(r'\r?\n-{2,}|\r?\n###|\r?\nHSC Biology|\r?\nবুঝতে পেরেছি|\r?\n\*', opt)[0].strip()
            opt = re.sub(r'^\((?:ক|খ|গ|ঘ)\)\s*', '', opt).strip()
            opts.append(opt)
        return opts

    valid_starts = []
    for i, start in enumerate(starts):
        end = starts[i+1] if i+1 < len(starts) else len(body)
        chunk = body[start:end].strip()
        if len(extract_options(chunk)) >= 4:
            valid_starts.append(start)

    chunks = []
    for i, start in enumerate(valid_starts):
        end = valid_starts[i+1] if i+1 < len(valid_starts) else len(body)
        chunks.append(body[start:end].strip())

    questions = []
    for qchunk in chunks:
        qchunk = re.sub(r'^[০১২৩৪৫৬৭৮৯]+।\s*', '', qchunk)
        ans_match = answer_re.search(qchunk)
        ans = {'ক':0,'খ':1,'গ':2,'ঘ':3}[ans_match.group(1)] if ans_match else None
        qchunk_clean = qchunk.replace('**', '')
        options = extract_options(qchunk_clean)
        if len(options) > 4:
            options = options[:4]
        first_marker = option_marker.search(qchunk_clean)
        question_text = qchunk_clean[:first_marker.start()].strip() if first_marker else qchunk_clean.strip()
        if len(options) == 4:
            questions.append({'question': question_text, 'options': options, 'correctOptionIndex': ans})
    return questions


def debug_sections():
    text = Path('src/data/hsc/science/biology/2nd-paper/board-questions/year-wise/2022/question.txt').read_text(encoding='utf-8').replace('\r\n', '\n')
    sections = parse_sections(text)
    board_names = ['Dhaka Board', 'Chattogram Board', 'Cumilla Board', 'Dinajpur Board', 'Rajshahi Board', 'Sylhet Board', 'Barishal Board', 'Jashore Board', 'Mymensingh Board']
    for num, bangla, ename, start, end in sections:
        if ename not in board_names:
            continue
        body = text[start:end].strip()
        lines = body.split('\n')
        print('===', ename, 'tail ===')
        print('\n'.join(lines[-40:]))
        print('---')


def debug_problem_chunks():
    text = Path('src/data/hsc/science/biology/2nd-paper/board-questions/year-wise/2022/question.txt').read_text(encoding='utf-8').replace('\r\n', '\n')
    sections = parse_sections(text)
    for num, bangla, ename, start, end in sections:
        body = text[start:end].strip()
        limit = 25 if ename == 'Mymensingh Board' else None
        questions = parse_questions(body, limit=limit)
        problems = [i+1 for i,q in enumerate(questions) if len(q['options']) != 4 or q['correctOptionIndex'] is None]
        if not problems:
            continue
        print('===', ename, 'problems', problems, '===')
        num_re = re.compile(r'(^[০১২৩৪৫৬৭৮৯]+)।', flags=re.MULTILINE)
        starts = [m.start() for m in num_re.finditer(body) if m.start() == 0 or body[m.start()-1] == '\n']
        if limit is not None:
            starts = starts[:limit]
        for idx in problems:
            start = starts[idx-1]
            end = starts[idx] if idx < len(starts) else len(body)
            qchunk = body[start:end].strip()
            print('---QUESTION', idx, 'RAW---')
            print(qchunk)
            print('---')


def main():
    text = Path('src/data/hsc/science/biology/2nd-paper/board-questions/year-wise/2022/question.txt').read_text(encoding='utf-8').replace('\r\n', '\n')
    sections = parse_sections(text)
    for num, bangla, ename, start, end in sections:
        body = text[start:end].strip()
        limit = 25 if ename == 'Mymensingh Board' else None
        questions = parse_questions(body, limit=limit)
        print('BOARD', ename, 'parsed', len(questions))
        for q in questions[:1]:
            print('Q:', q['question'])
            print('opts', q['options'])
            print('ans', q['correctOptionIndex'])
        print('last ans', questions[-1]['correctOptionIndex'])
        problem = [i+1 for i,q in enumerate(questions) if len(q['options']) != 4 or q['correctOptionIndex'] is None]
        print('problems', problem)
        print('---')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'debug':
        debug_sections()
    elif len(sys.argv) > 1 and sys.argv[1] == 'debug2':
        debug_problem_chunks()
    else:
        main()
