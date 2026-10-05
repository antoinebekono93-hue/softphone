#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BUSTER CALL — Global Branding Replacement Script
================================================
Remplace les anciens brandings (Antigravity, Softphone, Telnyx visible)
par Buster Call dans les fichiers user-facing.

RÈGLES :
- Remplacer : textes UI, JSX, metadata, SEO, PWA, messages user-facing
- Conserver : imports SDK, TELNYX_* env vars, routes API, Prisma fields,
              URLs api.telnyx.com, noms de fonctions camelCase, logs dev
"""

import os
import re
import sys
from typing import List, Tuple

ROOT = r'c:\Users\Antoine\3D Objects\github\2'
CHANGES: List[str] = []
ERRORS: List[str] = []

# ============================================================
# HELPERS
# ============================================================

def read_file(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path: str, content: str) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_in_file(path: str, replacements: List[Tuple[str, str]]) -> bool:
    """Apply literal string replacements to a file. Returns True if changed."""
    try:
        content = read_file(path)
    except Exception as e:
        ERRORS.append(f"READ ERROR {path}: {e}")
        return False
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        try:
            write_file(path, content)
            CHANGES.append(path)
            return True
        except Exception as e:
            ERRORS.append(f"WRITE ERROR {path}: {e}")
    return False

def regex_replace_in_file(path: str, pattern: str, replacement: str, flags=re.MULTILINE) -> bool:
    """Apply a regex replacement to a file. Returns True if changed."""
    try:
        content = read_file(path)
    except Exception as e:
        ERRORS.append(f"READ ERROR {path}: {e}")
        return False
    original = content
    content = re.sub(pattern, replacement, content, flags=flags)
    if content != original:
        try:
            write_file(path, content)
            CHANGES.append(path)
            return True
        except Exception as e:
            ERRORS.append(f"WRITE ERROR {path}: {e}")
    return False

def p(*args): print(*args, flush=True)

# ============================================================
# PHASE 1 — METADATA CENTRAUX
# ============================================================

def phase1_site_config():
    path = os.path.join(ROOT, 'lib', 'site-config.ts')
    p(f"  [P1] site-config.ts")
    replace_in_file(path, [
        ('brand: "Antigravity"', 'brand: "Buster Call"'),
        ("brand: 'Antigravity'", "brand: 'Buster Call'"),
        ('product: "Antigravity"', 'product: "Buster Call"'),
        ("product: 'Antigravity'", "product: 'Buster Call'"),
        # Support scope text
        ('"Softphone, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique."',
         '"Buster Call, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique."'),
        ("'Softphone, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.'",
         "'Buster Call, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.'"),
    ])

def phase1_layout():
    path = os.path.join(ROOT, 'app', 'layout.tsx')
    p(f"  [P1] layout.tsx")
    replace_in_file(path, [
        # Title
        ('"Antigravity — Téléphonie professionnelle et agents vocaux IA"',
         '"Buster Call — Téléphonie professionnelle et agents vocaux IA"'),
        ("'Antigravity — Téléphonie professionnelle et agents vocaux IA'",
         "'Buster Call — Téléphonie professionnelle et agents vocaux IA'"),
        # Template
        ('"%s | Antigravity"', '"%s | Buster Call"'),
        ("'%s | Antigravity'", "'%s | Buster Call'"),
        # Description - softphone cloud
        ('"Plateforme B2B de communication d\'entreprise : numéros professionnels, softphone cloud, routage d\'appels, SMS et WhatsApp, agents vocaux assistés par intelligence artificielle."',
         '"Plateforme B2B de communication d\'entreprise : numéros professionnels, Buster Call, routage d\'appels, SMS et WhatsApp, agents vocaux assistés par intelligence artificielle."'),
        # OpenGraph description - softphone cloud
        ('"Numéros professionnels, softphone cloud, routage d\'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle."',
         '"Numéros professionnels, Buster Call, routage d\'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle."'),
        # Twitter description
        ('"Numéros professionnels, softphone cloud, routage d\'appels et agents vocaux assistés par intelligence artificielle."',
         '"Numéros professionnels, Buster Call, routage d\'appels et agents vocaux assistés par intelligence artificielle."'),
        # Authors name
        ('name: "Antigravity"', 'name: "Buster Call"'),
        ("name: 'Antigravity'", "name: 'Buster Call'"),
        # Creator
        ('creator: "Antigravity"', 'creator: "Buster Call"'),
        ("creator: 'Antigravity'", "creator: 'Buster Call'"),
        # Apple web app title
        ('title: "Antigravity"', 'title: "Buster Call"'),
        ("title: 'Antigravity'", "title: 'Buster Call'"),
        # OpenGraph siteName
        ('siteName: "Antigravity"', 'siteName: "Buster Call"'),
        ("siteName: 'Antigravity'", "siteName: 'Buster Call'"),
        # OpenGraph title
        ('title: "Antigravity — Téléphonie professionnelle et agents vocaux IA"',
         'title: "Buster Call — Téléphonie professionnelle et agents vocaux IA"'),
    ])

def phase1_manifest():
    path = os.path.join(ROOT, 'public', 'manifest.json')
    p(f"  [P1] manifest.json")
    replace_in_file(path, [
        ('"name": "Antigravity"', '"name": "Buster Call"'),
        ('"short_name": "Antigravity"', '"short_name": "Buster Call"'),
        # description softphone cloud
        ('"description": "Système de communication omnicanale pour entreprises B2B — softphone cloud, agents vocaux IA, messagerie."',
         '"description": "Buster Call — Système de communication omnicanale pour entreprises B2B. Agents vocaux IA, messagerie multicanal."'),
        # Shortcut name
        ('"name": "Softphone"', '"name": "Buster Call"'),
        # Shortcut description
        ('"description": "Ouvrir le softphone"', '"description": "Ouvrir Buster Call"'),
    ])

def phase1_readme():
    path = os.path.join(ROOT, 'README.md')
    if os.path.exists(path):
        p(f"  [P1] README.md")
        replace_in_file(path, [
            ('Antigravity', 'Buster Call'),
            ('Softphone Xi', 'Buster Call'),
            ('Softphone-Xi', 'Buster Call'),
        ])

# ============================================================
# PHASE 2 — PAGES PUBLIQUES / MARKETING
# ============================================================

def phase2_homepage():
    path = os.path.join(ROOT, 'app', 'page.tsx')
    p(f"  [P2] app/page.tsx (homepage)")
    replace_in_file(path, [
        # Telnyx logo in integrations section → keep as technical partner mention but relabeled
        # Per the rule: homepage should not expose Telnyx as brand. Since this section says
        # "Ces éditeurs fournissent les briques techniques" (technically disclosed), we keep the 
        # Telnyx entry but the note below says "ne pas exposer Telnyx au client final par défaut".
        # Decision: remove Telnyx from the public integration logos since it's our hidden provider.
        (
            '<div className="text-2xl font-bold text-[var(--text-primary)]">Telnyx</div>',
            ''  # Remove Telnyx from public integration logos
        ),
        # SEO description
        ('"Numéros professionnels, softphone web et mobile, appels internes, routage, SMS et WhatsApp, agents vocaux IA et analytiques : une plateforme de communication B2B."',
         '"Numéros professionnels, Buster Call web et mobile, appels internes, routage, SMS et WhatsApp, agents vocaux IA et analytiques : une plateforme de communication B2B."'),
        # OpenGraph description
        ('"Numéros professionnels, softphone cloud, routage d\'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle."',
         '"Numéros professionnels, Buster Call, routage d\'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle."'),
    ])

def phase2_about():
    path = os.path.join(ROOT, 'app', 'about', 'page.tsx')
    if not os.path.exists(path): return
    p(f"  [P2] app/about/page.tsx")
    content = read_file(path)
    original = content
    # Replace softphone cloud → Buster Call in string contexts
    content = content.replace('softphone cloud', 'Buster Call')
    content = content.replace('softphone dans le navigateur', 'Buster Call dans le navigateur')
    content = content.replace('title: "Softphone cloud"', 'title: "Buster Call Connect"')
    content = content.replace("title: 'Softphone cloud'", "title: 'Buster Call Connect'")
    content = content.replace('simple softphone', 'simple application d\'appels')
    # Antigravity brand
    content = content.replace('"Antigravity', '"Buster Call')
    content = content.replace("'Antigravity", "'Buster Call")
    if content != original:
        write_file(path, content)
        CHANGES.append(path)

def phase2_acceptable_use():
    path = os.path.join(ROOT, 'app', 'acceptable-use', 'page.tsx')
    if not os.path.exists(path): return
    p(f"  [P2] app/acceptable-use/page.tsx")
    replace_in_file(path, [
        ('softphone, appels', 'Buster Call, appels'),
        ('Softphone, appels', 'Buster Call, appels'),
        ('Antigravity', 'Buster Call'),
    ])

def phase2_legal_pages():
    """Update legal pages - replace Antigravity brand, keep Telnyx if legally needed."""
    legal_dirs = ['terms', 'privacy', 'refund-policy', 'contact']
    for d in legal_dirs:
        path = os.path.join(ROOT, 'app', d, 'page.tsx')
        if os.path.exists(path):
            p(f"  [P2] app/{d}/page.tsx")
            replace_in_file(path, [
                # Replace Antigravity as product brand (NOT legal entity)
                # siteConfig.brand already handles most of this dynamically
                # Explicit string mentions:
                ('"Antigravity"', '"Buster Call"'),
                ("'Antigravity'", "'Buster Call'"),
                # User-facing softphone mentions
                ('softphone', 'Buster Call'),
                ('Softphone', 'Buster Call'),
            ])

def phase2_marketing_pages():
    """Scan other marketing pages under app/ for Antigravity/Softphone branding."""
    marketing_dirs = [
        'pricing', 'onboarding', 'register', 'login',
        'integrations', 'etudes-de-cas', 'secteurs',
        'ia', 'receptionniste-ia',
    ]
    for d in marketing_dirs:
        page_path = os.path.join(ROOT, 'app', d, 'page.tsx')
        if os.path.exists(page_path):
            content = read_file(page_path)
            original = content
            # Only replace as brand name (capitalized or in strings)
            # Be careful: 'softphone' in generic context might be a category description
            # Rule: replace when used as brand/product label
            content = content.replace('Antigravity', 'Buster Call')
            content = content.replace('Softphone Xi', 'Buster Call')
            content = content.replace('Softphone-Xi', 'Buster Call')
            # Generic "Softphone" as product label in UI
            for old, new in [
                ('Softphone Web', 'Buster Call Web'),
                ('Softphone connecté', 'Buster Call connecté'),
                ('Softphone déconnecté', 'Buster Call déconnecté'),
                ('"Softphone"', '"Buster Call"'),
                ("'Softphone'", "'Buster Call'"),
                ('>Softphone<', '>Buster Call<'),
            ]:
                content = content.replace(old, new)
            # Telnyx as brand in marketing
            content = content.replace('"Telnyx Number"', '"Numéro Buster Call"')
            content = content.replace('"Telnyx Calling"', '"Appels Buster Call"')
            content = content.replace('>Telnyx Voice<', '>Buster Call<')
            content = content.replace('>Telnyx<', '>Buster Call<')
            if content != original:
                write_file(page_path, content)
                CHANGES.append(page_path)
                p(f"  [P2] app/{d}/page.tsx")

# ============================================================
# PHASE 3 — DASHBOARD UI & COMPOSANTS
# ============================================================

def phase3_components():
    """Scan components/ for user-facing branding strings."""
    p("  [P3] Scanning components/...")
    components_dir = os.path.join(ROOT, 'components')
    
    # Lines to SKIP if they match these patterns (technical references)
    skip_patterns = [
        re.compile(r'^\s*(import|export)\s'),
        re.compile(r'TELNYX_'),
        re.compile(r'telnyxClient|telnyx\.|telnyxPayload|telnyxId|telnyxSim|telnyxMessage|telnyxNumber|telnyxConnection|telnyxCred|telnyxOrder'),
        re.compile(r'api\.telnyx\.com'),
        re.compile(r'from ["\']@/lib/telnyx'),
        re.compile(r'console\.(log|error|warn|info)'),
        re.compile(r'//.*'),
        re.compile(r'getConfiguredTelnyx|saveTelnyx|fetchTelnyx|ensureTelnyx'),
    ]
    
    # User-facing replacement rules for components
    replacements = [
        # Brand names as JSX text
        ('>Antigravity<', '>Buster Call<'),
        ('>Softphone<', '>Buster Call<'),
        ('>Telnyx Voice<', '>Buster Call<'),
        # In string literals that are clearly labels
        ('Antigravity', 'Buster Call'),
        ('Softphone Xi', 'Buster Call'),
        ('Softphone-Xi', 'Buster Call'),
        # Product-specific labels
        ('Softphone Web', 'Buster Call Web'),
        ('Softphone connecté', 'Buster Call connecté'),
        ('Softphone déconnecté', 'Buster Call déconnecté'),
        ('votre softphone', 'Buster Call'),
        ('le softphone', 'Buster Call'),
        ('du softphone', 'de Buster Call'),
        ('Votre Softphone', 'Buster Call'),
        ('Le Softphone', 'Buster Call'),
        # Navigation labels
        ('"Softphone"', '"Buster Call"'),
        ("'Softphone'", "'Buster Call'"),
        ('label: "Softphone"', 'label: "Buster Call"'),
        ("label: 'Softphone'", "label: 'Buster Call'"),
        ('title: "Softphone"', 'title: "Buster Call"'),
        ("title: 'Softphone'", "title: 'Buster Call'"),
        # Telnyx as visible brand in UI
        ('Telnyx Voice', 'Buster Call'),
        ('Telnyx WebRTC', 'Buster Call'),
        # alt texts and aria labels
        ('alt="Antigravity"', 'alt="Buster Call"'),
        ('alt="Softphone"', 'alt="Buster Call"'),
        ('aria-label="Softphone"', 'aria-label="Buster Call"'),
        ('aria-label="Antigravity"', 'aria-label="Buster Call"'),
    ]
    
    count = 0
    for root_dir, dirs, files in os.walk(components_dir):
        # Skip node_modules if somehow nested
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next']]
        for filename in files:
            if not filename.endswith(('.tsx', '.ts', '.jsx', '.js', '.css')):
                continue
            filepath = os.path.join(root_dir, filename)
            try:
                content = read_file(filepath)
                original = content
                # Apply replacements
                for old, new in replacements:
                    if old in content:
                        content = content.replace(old, new)
                if content != original:
                    write_file(filepath, content)
                    CHANGES.append(filepath)
                    count += 1
                    rel = os.path.relpath(filepath, ROOT)
                    p(f"    ✓ {rel}")
            except Exception as e:
                ERRORS.append(f"  ERROR {filepath}: {e}")
    p(f"  [P3] {count} component files updated")

def phase3_dashboard_pages():
    """Scan dashboard pages for branding."""
    p("  [P3] Scanning dashboard pages...")
    dashboard_dir = os.path.join(ROOT, 'app', 'dashboard')
    if not os.path.exists(dashboard_dir):
        p("  [P3] No dashboard dir found")
        return
    
    replacements = [
        ('Antigravity', 'Buster Call'),
        ('Softphone Xi', 'Buster Call'),
        ('Softphone-Xi', 'Buster Call'),
        ('Softphone Web', 'Buster Call Web'),
        ('Softphone connecté', 'Buster Call connecté'),
        ('Softphone déconnecté', 'Buster Call déconnecté'),
        ('"Softphone"', '"Buster Call"'),
        ("'Softphone'", "'Buster Call'"),
        ('>Softphone<', '>Buster Call<'),
        ('label: "Softphone"', 'label: "Buster Call"'),
        ("label: 'Softphone'", "label: 'Buster Call'"),
        ('title: "Softphone"', 'title: "Buster Call"'),
        ("title: 'Softphone'", "title: 'Buster Call'"),
        ('Telnyx Voice', 'Buster Call'),
        # User-facing error messages about connection
        ('"Telnyx connecté"', '"Buster Call connecté"'),
        ("'Telnyx connecté'", "'Buster Call connecté'"),
        ('"Telnyx déconnecté"', '"Buster Call déconnecté"'),
        ('>Telnyx Voice<', '>Buster Call<'),
    ]
    
    count = 0
    for root_dir, dirs, files in os.walk(dashboard_dir):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next']]
        for filename in files:
            if not filename.endswith(('.tsx', '.ts', '.jsx', '.js')):
                continue
            filepath = os.path.join(root_dir, filename)
            try:
                content = read_file(filepath)
                original = content
                for old, new in replacements:
                    if old in content:
                        content = content.replace(old, new)
                if content != original:
                    write_file(filepath, content)
                    CHANGES.append(filepath)
                    count += 1
                    rel = os.path.relpath(filepath, ROOT)
                    p(f"    ✓ {rel}")
            except Exception as e:
                ERRORS.append(f"  ERROR {filepath}: {e}")
    p(f"  [P3] {count} dashboard files updated")

# ============================================================
# PHASE 4 — GOD MODE UI TITLES
# ============================================================

def phase4_god_mode():
    p("  [P4] God Mode UI titles...")
    
    # TelnyxHubClient.tsx — only UI-visible text
    hub_path = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'TelnyxHubClient.tsx')
    if os.path.exists(hub_path):
        replace_in_file(hub_path, [
            # Page title (h1)
            ('>Telnyx Mission Control<', '>Provider Configuration (Telnyx)<'),
            # Page subtitle
            ('>Manage your master Telnyx account, view balance, and configure routing.<',
             '>Gérez la configuration du fournisseur, visualisez le solde et configurez le routage.<'),
            # Error box title
            ('>Telnyx API Error<', '>Erreur de configuration<'),
            # Account status connected
            ('>Your God Mode is securely connected to Telnyx.<',
             '>God Mode connecté au fournisseur.<'),
            # API key description
            ('This API key is used globally across the God Mode to manage Telnyx resources (fetch balances, buy numbers, list Webhooks).',
             'Cette clé API est utilisée globalement dans le God Mode pour gérer les ressources du fournisseur (solde, numéros, webhooks).'),
            # Public key placeholder
            ('"Copiez la clé publique Telnyx"', '"Copiez la clé publique Ed25519"'),
            ("'Copiez la clé publique Telnyx'", "'Copiez la clé publique Ed25519'"),
            # Outbound profile - tarif label (this is a form label for admin, "Telnyx" is appropriate as provider context)
            # Keep: 'Tarif Telnyx maximal / min' — admin knows they're setting Telnyx rates
            # Diagnostics text
            (">L'audit interroge Telnyx sans modifier la config<",
             ">L'audit interroge le fournisseur sans modifier la config<"),
            # Dernières livraisons vocales
            ('>Dernières livraisons vocales Telnyx<', '>Dernières livraisons vocales<'),
            # Webhook section
            ('Telnyx a refusé la configuration', 'Le fournisseur a refusé la configuration'),
            # User-facing message from actions
            ('configuration enregistrée localement, mais Telnyx a ref', 'configuration enregistrée localement, mais le fournisseur a ref'),
            # Detail about public key in check
            ('"Ajoutez la clé publique Telnyx d', '"Ajoutez la clé publique Ed25519 d'),
            # Number error message
            ('"Numéro inaccessible chez Tel', '"Numéro inaccessible chez le fournisseur'),
        ])
        p(f"    ✓ TelnyxHubClient.tsx")
    
    # god-mode/telnyx/page.tsx — page title metadata
    page_path = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'page.tsx')
    if os.path.exists(page_path):
        replace_in_file(page_path, [
            ('"Telnyx Hub | God Mode"', '"Provider Hub | God Mode"'),
            ("'Telnyx Hub | God Mode'", "'Provider Hub | God Mode'"),
            ('title: "Telnyx Hub', 'title: "Provider Hub'),
            ("title: 'Telnyx Hub", "title: 'Provider Hub"),
        ])
        p(f"    ✓ god-mode/telnyx/page.tsx")
    
    # god-mode/voice/page.tsx
    voice_path = os.path.join(ROOT, 'app', 'god-mode', 'voice', 'page.tsx')
    if os.path.exists(voice_path):
        replace_in_file(voice_path, [
            # User-facing descriptions (admin UI)
            ('le routage Telnyx et', 'le routage et'),
            ('Paramètres de connexion avec l\'API Telnyx Call Control.',
             'Paramètres de connexion Call Control.'),
            ('URL appelée par Telnyx pour gérer les événe', 'URL de webhook pour gérer les événements d\'appel'),
        ])
        p(f"    ✓ god-mode/voice/page.tsx")
    
    # god-mode/telnyx/actions.ts — user-facing error messages only
    actions_path = os.path.join(ROOT, 'app', 'god-mode', 'telnyx', 'actions.ts')
    if os.path.exists(actions_path):
        replace_in_file(actions_path, [
            # User-visible error messages (returned to UI)
            ('"La clé API Telnyx est obligatoire."', '"La clé API est obligatoire."'),
            ("'La clé API Telnyx est obligatoire.'", "'La clé API est obligatoire.'"),
            ('`Telnyx a refusé cette clé (HTTP ${validation.status}).`',
             '`Clé refusée par le fournisseur (HTTP ${validation.status}).`'),
            ('"La clé publique Ed25519 Telnyx est invalide."', '"La clé publique Ed25519 est invalide."'),
            ("'La clé publique Ed25519 Telnyx est invalide.'", "'La clé publique Ed25519 est invalide.'"),
            ('"Clé API Telnyx non configurée dans God Mode."', '"Clé API non configurée dans God Mode."'),
            ("'Clé API Telnyx non configurée dans God Mode.'", "'Clé API non configurée dans God Mode.'"),
            ('`Telnyx n\'a pas pu révoquer le credential : ${error.message}`',
             '`Le fournisseur n\'a pas pu révoquer le credential : ${error.message}`'),
            # The publicKey detail message
            ('"Ajoutez la clé publique Telnyx d', '"Ajoutez la clé publique Ed25519 d'),
            # Number error
            ('"Numéro inaccessible chez Tel', '"Numéro inaccessible chez le fournisseur'),
        ])
        p(f"    ✓ god-mode/telnyx/actions.ts (user-facing messages only)")

# ============================================================
# PHASE 5 — API ROUTES — USER-FACING ERROR MESSAGES
# ============================================================

def phase5_api_routes():
    """Replace only user-facing error messages in API routes. Leave all technical code intact."""
    p("  [P5] API routes — user-facing error messages...")
    
    # Specific user-facing string replacements in API routes
    # Only modify the human-readable text, NOT error codes or technical identifiers
    api_replacements = [
        # iot/sims
        ('"Configuration API Telnyx manquante"', '"Configuration du service manquante"'),
        ("'Configuration API Telnyx manquante'", "'Configuration du service manquante'"),
        ('`Erreur lors de la commande de l\'eSIM chez Telnyx.`', '`Erreur lors de la commande de l\'eSIM.`'),
        ('"Erreur lors de la commande de l\'eSIM chez Telnyx."', '"Erreur lors de la commande de l\'eSIM."'),
        ("'Erreur lors de la commande de l\\'eSIM chez Telnyx.'", "'Erreur lors de la commande de l\\'eSIM.'"),
        # iot/sims/bulk-toggle
        ('"Configuration API Telnyx manquante"', '"Configuration du service manquante"'),
        # numbers/buy — human readable confirmation
        ('`Commande Telnyx acceptée pour ${result.phoneNumber}. Activation en cours.`',
         '`Commande acceptée pour ${result.phoneNumber}. Activation en cours.`'),
        # sms/send — user visible error
        ("'Telnyx a refusé le message. Le montant a été remboursé.'",
         "'Le service a refusé le message. Le montant a été remboursé.'"),
        ('"Telnyx a refusé le message. Le montant a été remboursé."',
         '"Le service a refusé le message. Le montant a été remboursé."'),
        # transcribe — user-visible (though mostly dev-facing)
        ('"Telnyx API key not configured"', '"Service de transcription non configuré"'),
        ("'Telnyx API key not configured'", "'Service de transcription non configuré'"),
        # messaging-profiles user-visible
        ("'Création non confirmée. Vérifiez les profils Telnyx avant de rées", 
         "'Création non confirmée. Vérifiez les profils avant de rées"),
        ('"Création non confirmée. Vérifiez les profils Telnyx avant de rées',
         '"Création non confirmée. Vérifiez les profils avant de rées'),
        # campaign-worker user message
        ("'Telnyx n'a pas renvoyé de message ID'", "'Le service n\\'a pas renvoyé de message ID'"),
        ('\'Telnyx n\'a pas renvoyé de message ID\'', '\'Le service n\'a pas renvoyé de message ID\''),
        # rcs send - user error
        ("'Telnyx API Error'", "'Erreur du service'"),
        ('"Telnyx API Error"', '"Erreur du service"'),
        # coverage/porting — keep TELNYX_API_KEY error codes as-is since they're programmatic
    ]
    
    api_dir = os.path.join(ROOT, 'app', 'api')
    count = 0
    for root_dir, dirs, files in os.walk(api_dir):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next']]
        for filename in files:
            if not filename.endswith(('.ts', '.tsx', '.js')):
                continue
            filepath = os.path.join(root_dir, filename)
            try:
                content = read_file(filepath)
                original = content
                for old, new in api_replacements:
                    if old in content:
                        content = content.replace(old, new)
                if content != original:
                    write_file(filepath, content)
                    CHANGES.append(filepath)
                    count += 1
                    rel = os.path.relpath(filepath, ROOT)
                    p(f"    ✓ {rel}")
            except Exception as e:
                ERRORS.append(f"  ERROR {filepath}: {e}")
    p(f"  [P5] {count} API route files updated")

# ============================================================
# PHASE 6 — PWA / SEO SUPPLEMENTARY FILES
# ============================================================

def phase6_pwa_seo():
    p("  [P6] PWA/SEO supplementary files...")
    
    # robots.ts
    robots = os.path.join(ROOT, 'app', 'robots.ts')
    if os.path.exists(robots):
        replace_in_file(robots, [('Antigravity', 'Buster Call')])
        p(f"    ✓ robots.ts")
    
    # sitemap.ts
    sitemap = os.path.join(ROOT, 'app', 'sitemap.ts')
    if os.path.exists(sitemap):
        replace_in_file(sitemap, [('Antigravity', 'Buster Call')])
        p(f"    ✓ sitemap.ts")

# ============================================================
# PHASE 7 — CONTEXTS, HOOKS, LIB (user-facing strings)
# ============================================================

def phase7_contexts_hooks_lib():
    """Scan contexts/, hooks/, lib/ for user-facing branding strings."""
    p("  [P7] contexts/, hooks/, lib/...")
    
    dirs_to_scan = ['contexts', 'hooks']
    # lib/ has technical telnyx files — scan carefully
    
    replacements = [
        ('Antigravity', 'Buster Call'),
        ('Softphone Xi', 'Buster Call'),
        ('Softphone-Xi', 'Buster Call'),
        ('Softphone Web', 'Buster Call Web'),
        ('Softphone connecté', 'Buster Call connecté'),
        ('"Softphone"', '"Buster Call"'),
        ("'Softphone'", "'Buster Call'"),
        ('>Softphone<', '>Buster Call<'),
        ('Telnyx Voice', 'Buster Call'),
    ]
    
    count = 0
    for scan_dir_name in dirs_to_scan:
        scan_dir = os.path.join(ROOT, scan_dir_name)
        if not os.path.exists(scan_dir):
            continue
        for root_dir, dirs, files in os.walk(scan_dir):
            for filename in files:
                if not filename.endswith(('.tsx', '.ts', '.jsx', '.js')):
                    continue
                filepath = os.path.join(root_dir, filename)
                try:
                    content = read_file(filepath)
                    original = content
                    for old, new in replacements:
                        if old in content:
                            content = content.replace(old, new)
                    if content != original:
                        write_file(filepath, content)
                        CHANGES.append(filepath)
                        count += 1
                        rel = os.path.relpath(filepath, ROOT)
                        p(f"    ✓ {rel}")
                except Exception as e:
                    ERRORS.append(f"  ERROR {filepath}: {e}")
    
    # Scan lib/ but only non-telnyx files for branding
    lib_dir = os.path.join(ROOT, 'lib')
    if os.path.exists(lib_dir):
        for filename in os.listdir(lib_dir):
            if 'telnyx' in filename.lower():
                continue  # Skip telnyx technical files
            if not filename.endswith(('.ts', '.tsx', '.js')):
                continue
            filepath = os.path.join(lib_dir, filename)
            try:
                content = read_file(filepath)
                original = content
                # Only replace Antigravity brand in lib files (safe)
                content = content.replace('Antigravity', 'Buster Call')
                content = content.replace('Softphone Xi', 'Buster Call')
                content = content.replace('Softphone-Xi', 'Buster Call')
                if content != original:
                    write_file(filepath, content)
                    CHANGES.append(filepath)
                    count += 1
                    p(f"    ✓ lib/{filename}")
            except Exception as e:
                ERRORS.append(f"  ERROR {filepath}: {e}")
    
    p(f"  [P7] {count} files updated")

# ============================================================
# PHASE 8 — NOTIFICATIONS / EMAILS (server files)
# ============================================================

def phase8_notifications_emails():
    p("  [P8] Notifications/emails/server...")
    
    replacements_email = [
        ('Antigravity', 'Buster Call'),
        ('Softphone Xi', 'Buster Call'),
        ('Softphone-Xi', 'Buster Call'),
        ('"Welcome to Softphone"', '"Bienvenue sur Buster Call"'),
        ("'Welcome to Softphone'", "'Bienvenue sur Buster Call'"),
        ('Welcome to Antigravity', 'Bienvenue sur Buster Call'),
        ('Softphone Web', 'Buster Call Web'),
    ]
    
    dirs = ['server', 'worker', 'scripts']
    count = 0
    for d in dirs:
        scan_dir = os.path.join(ROOT, d)
        if not os.path.exists(scan_dir):
            continue
        for root_dir, subdirs, files in os.walk(scan_dir):
            subdirs[:] = [sd for sd in subdirs if sd not in ['node_modules']]
            for filename in files:
                if not filename.endswith(('.ts', '.tsx', '.js', '.json', '.md')):
                    continue
                if 'telnyx' in filename.lower():
                    continue
                filepath = os.path.join(root_dir, filename)
                try:
                    content = read_file(filepath)
                    original = content
                    for old, new in replacements_email:
                        if old in content:
                            content = content.replace(old, new)
                    if content != original:
                        write_file(filepath, content)
                        CHANGES.append(filepath)
                        count += 1
                        rel = os.path.relpath(filepath, ROOT)
                        p(f"    ✓ {rel}")
                except Exception as e:
                    ERRORS.append(f"  ERROR {filepath}: {e}")
    p(f"  [P8] {count} files updated")

# ============================================================
# MAIN
# ============================================================

def main():
    p("\n" + "="*60)
    p("BUSTER CALL — GLOBAL BRANDING REPLACEMENT")
    p("="*60)
    
    p("\n[PHASE 1] Metadata centraux")
    phase1_site_config()
    phase1_layout()
    phase1_manifest()
    phase1_readme()
    
    p("\n[PHASE 2] Pages publiques / marketing")
    phase2_homepage()
    phase2_about()
    phase2_acceptable_use()
    phase2_legal_pages()
    phase2_marketing_pages()
    
    p("\n[PHASE 3] Dashboard UI & composants")
    phase3_components()
    phase3_dashboard_pages()
    
    p("\n[PHASE 4] God Mode UI")
    phase4_god_mode()
    
    p("\n[PHASE 5] API routes — messages user-facing")
    phase5_api_routes()
    
    p("\n[PHASE 6] PWA / SEO")
    phase6_pwa_seo()
    
    p("\n[PHASE 7] Contexts / Hooks / Lib (non-telnyx)")
    phase7_contexts_hooks_lib()
    
    p("\n[PHASE 8] Notifications / Emails / Server")
    phase8_notifications_emails()
    
    p("\n" + "="*60)
    p(f"TOTAL FILES MODIFIED: {len(CHANGES)}")
    p(f"TOTAL ERRORS: {len(ERRORS)}")
    if CHANGES:
        p("\nModified files:")
        for c in CHANGES:
            p(f"  ✓ {os.path.relpath(c, ROOT)}")
    if ERRORS:
        p("\nERRORS:")
        for e in ERRORS:
            p(f"  ✗ {e}")
    p("="*60)
    p("DONE — Phase 1-8 complete.")

if __name__ == '__main__':
    main()
