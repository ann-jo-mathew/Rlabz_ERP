import os
import re

directory = r'c:\Users\alber\Desktop\Rlabz\Rlabz_ERP\ERP\frontend\src'

color_map = {
    '#059669': 'var(--primary)',
    '#047857': 'var(--primary-hover)',
    '#10b981': 'var(--primary-accent)',
    '#064e3b': 'var(--primary)',
    '#065f46': 'var(--primary)',
    '#022c22': 'var(--primary)',
    '#34d399': 'var(--primary-accent)',
    '#ecfdf5': 'var(--primary-light)',
    '#f0fdf4': 'var(--bg-main)',
    '#d1fae5': 'var(--border-color)',
    '#a7f3d0': 'var(--border-color)'
}

pattern = re.compile('|'.join(color_map.keys()), re.IGNORECASE)

def replace_color(match):
    return color_map[match.group(0).lower()]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(replace_color, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')

print('Done')
