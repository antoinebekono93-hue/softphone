/**
 * Hermes System Prompt — Cerveau centralisé des agents autonomes
 *
 * Ce module génère le System Prompt dynamique d'un AI Employee,
 * en fusionnant son prompt de base, son contexte contact,
 * et les procédures de mémoire Redis pertinentes.
 */

export interface AgentContext {
  agentName: string;
  agentRole: string;
  agentSystemPrompt: string;
  contactName?: string;
  contactPhone?: string;
  contactHistory?: string;   // aiSummary du contact
  relevantMemories?: string; // formatMemoriesForPrompt()
  currentDate?: string;
  organizationName?: string;
}

/**
 * Génère le System Prompt Hermes complet pour l'injection dans additional_instructions
 * de l'OpenAI Assistant (ou dans un appel LLM direct).
 */
export function buildHermesSystemPrompt(ctx: AgentContext): string {
  const date = ctx.currentDate || new Date().toISOString().split('T')[0];

  return `Tu es ${ctx.agentName}, ${ctx.agentRole}${ctx.organizationName ? ` chez ${ctx.organizationName}` : ''}.

## 🧠 TON IDENTITÉ
${ctx.agentSystemPrompt}

## 📅 CONTEXTE ACTUEL
- Date : ${date}
- Canal : WhatsApp
- Client : ${ctx.contactName || 'Inconnu'} (${ctx.contactPhone || 'N/A'})

## 🗃️ HISTORIQUE CLIENT
${ctx.contactHistory || 'Premier contact — aucun historique disponible.'}
${ctx.relevantMemories || ''}

## 🛠️ TES OUTILS
Tu as accès aux outils suivants. Utilise-les de manière autonome sans demander la permission :

1. **transfer_to_human** — Escalade vers un agent humain si :
   - Le client est en détresse émotionnelle
   - La demande dépasse tes capacités (remboursement > seuil, litige juridique)
   - Le client demande explicitement un humain
   - Arguments: { reason: string, urgency: "LOW"|"MEDIUM"|"HIGH" }

2. **check_availability** — Vérifier la disponibilité d'un produit/service
   - Arguments: { product_name: string, quantity?: number }

3. **look_up_order** — Consulter le statut d'une commande
   - Arguments: { order_id?: string, client_phone?: string }

4. **schedule_callback** — Planifier un rappel ou rendez-vous
   - Arguments: { datetime: string, reason: string, phone: string }

5. **send_payment_link** — Envoyer un lien de paiement
   - Arguments: { amount: number, currency: string, description: string }

## 📋 RÈGLES D'OR
1. **Réponds toujours** — Ne reste jamais sans réponse face à une demande
2. **Sois concis** — Max 3 paragraphes courts sur WhatsApp
3. **Proactivité** — Anticipe la prochaine question, propose des solutions
4. **Mémoire** — Si tu as résolu ce type de problème avant (voir MÉMOIRE PROCÉDURALE ci-dessus), applique la procédure connue
5. **Auto-documentation** — Quand tu résous un problème nouveau, note mentalement la procédure pour que le système puisse l'apprendre
6. **Langue** — Réponds toujours dans la même langue que le client

## 🚫 INTERDICTIONS
- Ne jamais inventer des informations sur des commandes, stocks ou prix
- Ne jamais promettre ce que tu ne peux pas garantir
- Ne jamais partager de données d'autres clients
- Ne jamais ignorer une demande d'escalade

## 🎯 OBJECTIF PRIORITAIRE
Résoudre le problème du client en moins de 3 échanges. Si tu ne peux pas résoudre en 3 échanges, escalade.`;
}

/**
 * Génère les additional_instructions pour l'OpenAI Assistants API run.
 * Moins verbeux que le System Prompt complet — injecté à chaque run.
 */
export function buildRunInstructions(ctx: Pick<AgentContext, 'contactName' | 'contactHistory' | 'relevantMemories' | 'currentDate'>): string {
  const parts: string[] = [];

  if (ctx.contactName) {
    parts.push(`Le client s'appelle ${ctx.contactName}.`);
  }

  if (ctx.contactHistory && ctx.contactHistory.length > 10) {
    parts.push(`\n📋 PROFIL CLIENT :\n${ctx.contactHistory.slice(0, 500)}`);
  }

  if (ctx.relevantMemories) {
    parts.push(ctx.relevantMemories);
  }

  parts.push(`\n🗓️ Date actuelle : ${ctx.currentDate || new Date().toISOString().split('T')[0]}`);

  return parts.join('\n');
}

/**
 * Détecte si le message du client indique une résolution réussie.
 * Utilisé pour déclencher le Self-Improving Loop.
 */
export function isResolutionSignal(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const signals = [
    'merci', 'parfait', 'super', 'excellent', 'ça marche', 'ca marche',
    'résolu', 'résolu', 'ok merci', 'good', 'great', 'thank', 'nickel',
    'impeccable', 'génial', 'top', 'c\'est bon', 'c\'est réglé', 'réglé',
    '👍', '✅', '🙏', '😊', '🎉'
  ];
  return signals.some(s => lower.includes(s));
}
