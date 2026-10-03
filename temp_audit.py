base = 'C:/Users/Antoine/3D Objects/github/2'
files = [
  'app/receptionniste-ia/page.tsx',
  'app/secteurs/page.tsx',
  'app/about/page.tsx',
  'app/contact/page.tsx',
  'app/pricing/page.tsx',
  'components/landing/FinalCTA.tsx',
  'components/landing/HeroSection.tsx',
  'components/landing/CaseStudies.tsx',
  'components/landing/IndustrySolutions.tsx',
  'components/landing/ProductTabs.tsx',
  'components/marketing/MarketingHeader.tsx',
  'components/marketing/MarketingFooter.tsx',
  'components/marketing/LegalDocument.tsx',
]
import os, re
links = set()
for f in files:
    full = os.path.join(base, f)
    if os.path.exists(full):
        with open(full, encoding='utf-8', errors='ignore') as fh:
            for line in fh:
                for m in re.findall(r'href\s*=\s*\"([^\"]+)\"', line):
                    links.add(m)
                for m in re.findall(r'href\s*=\s*\'([^\']+)\'', line):
                    links.add(m)
for l in sorted(links):
    print(l)
