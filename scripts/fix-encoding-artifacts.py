from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

replacements = {
    'â€¢': ' - ',
    'Â·': ' - ',
    'â€”/â€”': '- / -',
    'â€”': '-',
    'âœ“ COMPLETED': 'COMPLETED',
    'â— LIVE': 'LIVE',
    'Ã¢â€ â€™': '>',
    'Ã°Å¸â€˜Â¤': 'PLAYER',
    'Ã°Å¸â€Â': 'LOCK',
    'Ã°Å¸â€ºÂ Ã¯Â¸Â': 'TOOLS',
    'Ã¢Å“ÂÃ¯Â¸Â': 'EDIT',
}

changed = 0
for old, new in replacements.items():
    if old in s:
        count = s.count(old)
        s = s.replace(old, new)
        changed += count

p.write_text(s, encoding='utf-8')
print(f'replaced {changed} encoding artifacts in {p}')

bad = []
for path in Path('src').rglob('*'):
    if not path.is_file() or path.suffix not in {'.ts', '.tsx', '.css'}:
        continue
    text = path.read_text(encoding='utf-8-sig', errors='replace')
    for marker in ('â', 'Â', 'Ã'):
        if marker in text:
            bad.append(f'{path}: contains {marker}')

if bad:
    print('\n'.join(bad))
    raise SystemExit('encoding artifacts remain under src/')

print('no common encoding artifacts remain under src/')
