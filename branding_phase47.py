#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phases 4-7 of Buster Call branding replacement."""
import os, sys

ROOT = r'c:\Users\Antoine\3D Objects\github\2'
CHANGES = []

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def patch(path, replacements):
    try:
        c = read_file(path)
        orig = c
        for old, new in replacements:
            c = c.replace(old, new)
        if c != orig:
            write_file(path, c)
            CHANGES.append(path)
            print('  OK:', os.path.relpath(path, ROOT))
        else:
            print('  unchanged:', os.path.relpath(path, ROOT))
    except Exception as e:
        print('  ERROR', path, str(e))

# ============================================================
# PHASE 4 - God Mode UI
# ============================================================
print('PHASE 4 - God Mode UI')

hub = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'TelnyxHubClient.tsx')
patch(hub, [
    ('>Telnyx Mission Control<', '>Provider Configuration (Telnyx)<'),
    ('>Telnyx API Error<', '>Erreur de configuration<'),
    ('Your God Mode is securely connected to Telnyx.', 'God Mode connecte au fournisseur.'),
    ('This API key is used globally across the God Mode to manage Telnyx resources (fetch balances, buy numbers, list Webhooks).',
     'Cette cle API est utilisee dans God Mode pour gerer les ressources du fournisseur (solde, numeros, webhooks).'),
    ('Manage your master Telnyx account, view balance, and configure routing.',
     'Gerez la configuration du fournisseur, visualisez le solde et configurez le routage.'),
    ("Copiez la cl\u00e9 publique Telnyx", "Copiez la cl\u00e9 publique Ed25519"),
    ('L\u2019audit interroge Telnyx sans modifier la config', 'L\u2019audit interroge le fournisseur sans modifier la config'),
    ('>Derni\u00e8res livraisons vocales Telnyx<', '>Derni\u00e8res livraisons vocales<'),
    ('configuration enregistr\u00e9e localement, mais Telnyx a ref', 'configuration enregistr\u00e9e localement, mais le fournisseur a ref'),
    ('configuration enregistr\u00e9e localement, mais Telnyx a ref', 'configuration enregistr\u00e9e localement, mais le fournisseur a ref'),
    ('"Ajoutez la cl\u00e9 publique Telnyx d', '"Ajoutez la cl\u00e9 publique Ed25519 d'),
    ('"Num\u00e9ro inaccessible chez Tel', '"Num\u00e9ro inaccessible chez le fournisseur'),
    ('Num\u00e9ro inaccessible chez Telnyx', 'Num\u00e9ro inaccessible chez le fournisseur'),
])

page = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'page.tsx')
patch(page, [
    ('Telnyx Hub | God Mode', 'Provider Hub | God Mode'),
    ('Telnyx Hub', 'Provider Hub'),
])

voice = os.path.join(ROOT, 'app', 'god-mode', 'voice', 'page.tsx')
if os.path.exists(voice):
    patch(voice, [
        ('le routage Telnyx et', 'le routage et'),
        ('Param\u00e8tres de connexion avec l\u2019API Telnyx Call Control.', 'Param\u00e8tres de connexion Call Control.'),
        ("Param\u00e8tres de connexion avec l'API Telnyx Call Control.", "Param\u00e8tres de connexion Call Control."),
        ('URL appel\u00e9e par Telnyx pour g\u00e9rer les \u00e9v\u00e9nements', 'URL de webhook pour g\u00e9rer les \u00e9v\u00e9nements d\u2019appel'),
    ])

actions = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'actions.ts')
patch(actions, [
    ('La cl\u00e9 API Telnyx est obligatoire.', 'La cl\u00e9 API est obligatoire.'),
    ('La cl\u00e9 publique Ed25519 Telnyx est invalide.', 'La cl\u00e9 publique Ed25519 est invalide.'),
    ('Cl\u00e9 API Telnyx non configur\u00e9e dans God Mode.', 'Cl\u00e9 API non configur\u00e9e dans God Mode.'),
    ('Telnyx a refus\u00e9 cette cl\u00e9', 'Cl\u00e9 refus\u00e9e par le fournisseur'),
    ("Telnyx n\u2019a pas pu r\u00e9voquer le credential", "Le fournisseur n\u2019a pas pu r\u00e9voquer le credential"),
    ("Telnyx n'a pas pu r\u00e9voquer le credential", "Le fournisseur n'a pas pu r\u00e9voquer le credential"),
])

# Other God Mode pages
for root_d, dirs, files in os.walk(os.path.join(ROOT, 'app', 'god-mode')):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.next']]
    for fname in files:
        if not fname.endswith(('.tsx', '.ts')): continue
        fpath = os.path.join(root_d, fname)
        if 'TelnyxHubClient' in fname or 'actions' in fname: continue
        try:
            c = read_file(fpath)
            orig = c
            c = c.replace('Antigravity', 'Buster Call')
            if c != orig:
                write_file(fpath, c)
                CHANGES.append(fpath)
                print('  OK:', os.path.relpath(fpath, ROOT))
        except Exception as e:
            print('  ERROR', str(e))

# ============================================================
# PHASE 5 - API routes user-facing messages
# ============================================================
print('\nPHASE 5 - API routes user-facing messages')
api_dir = os.path.join(ROOT, 'app', 'api')
api_replacements = [
    ('Configuration API Telnyx manquante', 'Configuration du service manquante'),
    ('Telnyx API key not configured', 'Service de transcription non configure'),
    ('Telnyx a refus\u00e9 le message. Le montant a \u00e9t\u00e9 rembours\u00e9.', 'Le service a refus\u00e9 le message. Le montant a \u00e9t\u00e9 rembours\u00e9.'),
    ('V\u00e9rifiez les profils Telnyx avant', 'V\u00e9rifiez les profils avant'),
    ('Telnyx API Error', 'Erreur du service'),
    ('Commande Telnyx accept\u00e9e pour', 'Commande accept\u00e9e pour'),
    ("Erreur lors de la commande de l'eSIM chez Telnyx.", "Erreur lors de la commande de l'eSIM."),
    ('Missing Telnyx profile ID', 'Profil non confirme'),
]
count = 0
for root_d, dirs, files in os.walk(api_dir):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.next']]
    for fname in files:
        if not fname.endswith(('.ts', '.tsx', '.js')): continue
        fpath = os.path.join(root_d, fname)
        try:
            c = read_file(fpath)
            orig = c
            for old, new in api_replacements:
                c = c.replace(old, new)
            if c != orig:
                write_file(fpath, c)
                count += 1
                print('  OK:', os.path.relpath(fpath, ROOT))
        except Exception as e:
            print('  ERROR', fpath, str(e))
print('API routes updated:', count)

# ============================================================
# PHASE 6 - contexts/hooks/lib
# ============================================================
print('\nPHASE 6 - contexts/hooks/lib non-telnyx')
brand_repls = [
    ('Antigravity', 'Buster Call'),
    ('Softphone Xi', 'Buster Call'),
    ('Softphone-Xi', 'Buster Call'),
]
for scan_name in ['contexts', 'hooks']:
    scan_dir = os.path.join(ROOT, scan_name)
    if not os.path.exists(scan_dir): continue
    for root_d, dirs, files in os.walk(scan_dir):
        for fname in files:
            if not fname.endswith(('.ts', '.tsx', '.js', '.jsx')): continue
            fpath = os.path.join(root_d, fname)
            try:
                c = read_file(fpath)
                orig = c
                for old, new in brand_repls:
                    c = c.replace(old, new)
                if c != orig:
                    write_file(fpath, c)
                    print('  OK:', os.path.relpath(fpath, ROOT))
            except Exception as e:
                print('  ERROR', str(e))

lib_dir = os.path.join(ROOT, 'lib')
if os.path.exists(lib_dir):
    for fname in os.listdir(lib_dir):
        if 'telnyx' in fname.lower(): continue
        if not fname.endswith(('.ts', '.tsx', '.js')): continue
        fpath = os.path.join(lib_dir, fname)
        try:
            c = read_file(fpath)
            orig = c
            for old, new in brand_repls:
                c = c.replace(old, new)
            if c != orig:
                write_file(fpath, c)
                print('  OK: lib/', fname)
        except Exception as e:
            print('  ERROR', str(e))

# ============================================================
# PHASE 7 - Landing components
# ============================================================
print('\nPHASE 7 - Landing components')
landing = os.path.join(ROOT, 'components', 'landing')
landing_patches = [
    ('CaseStudies.tsx', [
        ('Softphone Web', 'Buster Call Web'),
        ('Softphone PWA', 'Buster Call'),
    ]),
    ('TrustBar.tsx', [
        ('Softphone Web', 'Buster Call Web'),
        ('Softphone ', 'Buster Call '),
    ]),
    ('StatsBar.tsx', [
        ('Softphone web, mobile et desktop', 'Buster Call web, mobile et desktop'),
    ]),
    ('ProductTabs.tsx', [
        ('Antigravity', 'Buster Call'),
        ('\u00e9l\u00e9phonie et WhatsApp via Telnyx', '\u00e9l\u00e9phonie et WhatsApp'),
    ]),
    ('IndustrySolutions.tsx', [
        ('Softphone dans le navigateur', 'Buster Call dans le navigateur'),
        ('Softphone web, mobile et desktop', 'Buster Call web, mobile et desktop'),
        ('"Softphone web, mobile et desktop"', '"Buster Call web, mobile et desktop"'),
    ]),
    ('ThoughtLeadership.tsx', [
        ('5 raisons de passer au softphone IA', '5 raisons de choisir Buster Call'),
    ]),
    ('MarketingFooter.tsx', [
        ('softphone cloud', 'Buster Call'),
        ('Antigravity', 'Buster Call'),
    ]),
    ('MarketingHeader.tsx', [
        ('Antigravity', 'Buster Call'),
    ]),
    ('HeroSection.tsx', [
        ('app.antigravity.fr', 'app.bustercall.fr'),
    ]),
]
for fname, repls in landing_patches:
    fpath = os.path.join(landing, fname)
    if os.path.exists(fpath):
        patch(fpath, repls)
    else:
        print('  MISSING:', fname)

# Pricing pages
pricing_dir = os.path.join(ROOT, 'app', 'pricing')
if os.path.exists(pricing_dir):
    for fname in os.listdir(pricing_dir):
        if fname.endswith(('.tsx', '.ts')):
            patch(os.path.join(pricing_dir, fname), [
                ('Softphone web et mobile', 'Buster Call web et mobile'),
                ('Antigravity', 'Buster Call'),
            ])

# MobileBottomNav  
mob_nav = os.path.join(ROOT, 'components', 'dashboard', 'MobileBottomNav.tsx')
if os.path.exists(mob_nav):
    patch(mob_nav, [])  # label Appels is fine as-is for nav

print('\nTOTAL CHANGED:', len(CHANGES))
print('Done - Phases 4-7 complete')
