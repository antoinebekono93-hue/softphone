import os
import re

directories_to_scan = ['app', 'components', 'contexts', 'hooks', 'lib', 'public', 'scripts', 'server', 'types', 'worker', 'docs', 'prisma']
root_dir = r'c:\Users\Antoine\3D Objects\github\2'

pattern = re.compile(r'(softphone|telnyx)', re.IGNORECASE)

output_file = os.path.join(root_dir, 'BRANDING_OCCURRENCES_FOUND.md')

with open(output_file, 'w', encoding='utf-8') as out:
    out.write('# BRANDING_OCCURRENCES_FOUND\n\n')
    out.write('| Fichier | Ligne | Texte | Catégorie | Visible | Remplacement |\n')
    out.write('|---|---|---|---|---|---|\n')
    
    for d in directories_to_scan:
        scan_dir = os.path.join(root_dir, d)
        if not os.path.exists(scan_dir): continue
        for root, _, files in os.walk(scan_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.html')):
                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, root_dir)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                            for i, line in enumerate(lines):
                                if pattern.search(line):
                                    # Very basic heuristic for visibility
                                    is_visible = 'NO'
                                    if 'className=' not in line and 'import ' not in line and 'telnyx' not in line.lower() or 'Softphone' in line:
                                        # Just a placeholder, we will refine manually or in a second pass
                                        pass
                                    clean_line = line.strip().replace('|', '&#124;')[:100]
                                    out.write(f'| {rel_path} | {i+1} | {clean_line} | TBD | TBD | TBD |\n')
                    except Exception as e:
                        pass
print('Done!')
