# BRANDING_OCCURRENCES_FOUND

| Fichier | Ligne | Texte | Catégorie | Visible | Remplacement |
|---|---|---|---|---|---|
| app\globals.css | 224 | Glass (réservé : softphone, overlays, modales, hero) | TBD | TBD | TBD |
| app\layout.tsx | 32 | "Plateforme B2B de communication d'entreprise : numéros professionnels, softphone cloud, routage d'a | TBD | TBD | TBD |
| app\layout.tsx | 34 | "softphone", | TBD | TBD | TBD |
| app\layout.tsx | 58 | "Numéros professionnels, softphone cloud, routage d'appels, messagerie multicanal et agents vocaux a | TBD | TBD | TBD |
| app\layout.tsx | 64 | "Numéros professionnels, softphone cloud, routage d'appels et agents vocaux assistés par intelligenc | TBD | TBD | TBD |
| app\page.tsx | 23 | "Numéros professionnels, softphone web et mobile, appels internes, routage, SMS et WhatsApp, agents  | TBD | TBD | TBD |
| app\page.tsx | 31 | "Numéros professionnels, softphone cloud, routage d'appels, messagerie multicanal et agents vocaux a | TBD | TBD | TBD |
| app\page.tsx | 96 | <div className="text-2xl font-bold text-[var(--text-primary)]">Telnyx</div> | TBD | TBD | TBD |
| app\about\page.tsx | 11 | "Antigravity réunit téléphonie professionnelle, softphone cloud, routage d'appels, messagerie et age | TBD | TBD | TBD |
| app\about\page.tsx | 19 | "Une plateforme de communication d'entreprise : numéros professionnels, softphone cloud, routage, me | TBD | TBD | TBD |
| app\about\page.tsx | 26 | body: "Chaque collaborateur dispose d'un numéro professionnel, d'une softphone dans le navigateur, e | TBD | TBD | TBD |
| app\about\page.tsx | 56 | title: "Softphone cloud", | TBD | TBD | TBD |
| app\about\page.tsx | 178 | simple softphone : c&apos;est la couche qui relie chaque canal de communication d&apos;une | TBD | TBD | TBD |
| app\acceptable-use\page.tsx | 44 | s&apos;applique à l&apos;ensemble des fonctions du service : softphone, appels, numéros | TBD | TBD | TBD |
| app\api\admin\settings\route.ts | 15 | phoneNumberRate: true, eSimRate: true, telnyxApiKey: true, | TBD | TBD | TBD |
| app\api\admin\settings\route.ts | 16 | telnyxConnectionId: true, updatedAt: true, | TBD | TBD | TBD |
| app\api\admin\settings\route.ts | 23 | const { telnyxApiKey, telnyxConnectionId, ...publicSettings } = settings; | TBD | TBD | TBD |
| app\api\admin\settings\route.ts | 26 | telnyxApiKeyConfigured: Boolean(telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim() | TBD | TBD | TBD |
| app\api\admin\settings\route.ts | 27 | telnyxConnectionConfigured: Boolean(telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_C | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\buy\route.ts | 4 | import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\buy\route.ts | 34 | const result = await purchaseTelnyxNumber({ | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\buy\route.ts | 46 | console.error("[Admin Telnyx Number Purchase]", error); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 2 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 5 | import { resellerNumberPrice } from "@/lib/telnyx-number-pricing"; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 20 | // 4. Call Telnyx Number Search API Query | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 33 | // 5. Fetch available numbers from Telnyx | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 34 | console.log(`Searching Telnyx for numbers in ${countryCode}...`); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 35 | const [telnyx, settings] = await Promise.all([ | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 36 | getConfiguredTelnyxClient(), | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 39 | const response = await telnyx.availablePhoneNumbers.list(queryOptions); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\search\route.ts | 53 | console.error("Error searching Telnyx numbers:", error); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 2 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 7 | import { ensureTelnyxNumberCodeControlled } from "@/lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 15 | // cette opération Telnyx. Les numéros EXISTANTS conservent leur org ; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 18 | // la norme via /api/admin/telnyx/numbers/assign). | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 26 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 29 | select: { telnyxConnectionId: true }, | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 31 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 33 | return NextResponse.json({ error: "TELNYX_VOICE_CONNECTION_NOT_CONFIGURED" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 35 | const response = await telnyx.phoneNumbers.list({ page: { size: 250 } }); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 36 | const telnyxNumbers = response.data &#124;&#124; []; | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 39 | // when Telnyx fulfills a number asynchronously. | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 58 | console.warn("[Telnyx Number Sync] Invalid stored number order payload", { orderId: order.id }); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 65 | if (telnyxNumbers.length > 0) { | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 77 | for (const num of telnyxNumbers) { | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 83 | console.warn("[Telnyx Number Sync] Ignored invalid number payload", { id: num.id }); | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 91 | await ensureTelnyxNumberCodeControlled({ | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 92 | telnyx, | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 93 | telnyxNumberId: num.id, | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 95 | messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(), | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 100 | where: { telnyxId: num.id }, | TBD | TBD | TBD |
| app\api\admin\telnyx\numbers\sync\route.ts | 109 | telnyxId: num.id, | TBD | TBD | TBD |
| app\api\analytics\session\[id]\route.ts | 7 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\analytics\session\[id]\route.ts | 13 | const res = await fetch(`https://api.telnyx.com/v2/session_analysis/call-session/${id}?max_depth=5&i | TBD | TBD | TBD |
| app\api\analytics\usage\route.ts | 4 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\analytics\usage\route.ts | 13 | const res = await fetch(`https://api.telnyx.com/v2/usage_reports?product=sip-trunking&start_date=${s | TBD | TBD | TBD |
| app\api\app-calls\route.ts | 19 | * Initie un appel APP_TO_APP (WebRTC natif P2P, hors Telnyx/PSTN). | TBD | TBD | TBD |
| app\api\app-calls\route.ts | 61 | //    partir par le chemin Telnyx/PSTN dédié). | TBD | TBD | TBD |
| app\api\app-calls\route.ts | 85 | // routé APP_TO_PSTN (Telnyx), hors de ce endpoint. | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 33 | if (!process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 34 | return NextResponse.json({ error: "Telnyx API key not configured" }, { status: 500 }); | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 37 | // Telnyx STT API expects multipart/form-data | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 43 | const response = await fetch("https://api.telnyx.com/v2/ai/audio/transcriptions", { | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 46 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}` | TBD | TBD | TBD |
| app\api\calls\[id]\transcribe\route.ts | 55 | console.error("[Telnyx STT Error]", data); | TBD | TBD | TBD |
| app\api\campaigns\send\route.ts | 76 | const telnyxMessageId = sent.data.telnyxMessageId; | TBD | TBD | TBD |
| app\api\campaigns\send\route.ts | 80 | data: { status: 'SENT', messageId: telnyxMessageId } | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 4 | import { telnyx } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 122 | // Send via Telnyx WhatsApp API | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 123 | // The 'from' number should be your registered WhatsApp Business number in Telnyx | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 124 | const fromNumber = process.env.TELNYX_WHATSAPP_NUMBER &#124;&#124; "+123456789"; | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 126 | let telnyxMessageId = `msg_${Date.now()}`; | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 128 | if (process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 129 | const response = await telnyx.messages.create({ | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 134 | // but Telnyx messages.create handles SMS/WhatsApp based on the sender ID type. | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 137 | telnyxMessageId = response.data.id; | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 141 | console.error("[TELNYX_SEND_ERROR]", err); | TBD | TBD | TBD |
| app\api\crm\opportunities\[id]\chatter\route.ts | 147 | telnyxMessageId, | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 6 | const TELNYX_DETAIL_RECORDS_URL = "https://api.telnyx.com/v2/detail_records"; | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 17 | async function fetchTelnyxCost(apiKey: string, callControlId: string): Promise<ProviderCost &#124; n | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 24 | "filter[telnyx_call_control_id]": callControlId, | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 27 | const response = await fetch(`${TELNYX_DETAIL_RECORDS_URL}?${query}`, { | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 34 | console.warn("[Billing Sync] Telnyx CDR family unavailable", { recordType, status: response.status } | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 40 | if (record?.telnyx_call_control_id && record.telnyx_call_control_id !== callControlId) continue; | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 46 | if (!successfulQuery) throw new Error("TELNYX_CDR_API_UNAVAILABLE"); | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 76 | select: { telnyxApiKey: true }, | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 78 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 79 | if (!apiKey) return NextResponse.json({ error: "TELNYX_API_KEY_NOT_CONFIGURED" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 87 | select: { telnyxCallControlId: true }, | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 97 | const provider = await fetchTelnyxCost(apiKey, candidate.telnyxCallControlId); | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 103 | callControlId: candidate.telnyxCallControlId, | TBD | TBD | TBD |
| app\api\cron\billing-sync\route.ts | 111 | callControlId: candidate.telnyxCallControlId, | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 4 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 77 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 94 | messaging_profile_id: campaign.phoneNumber.messagingProfile.telnyxId, | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 100 | if (status >= 400 && status < 500) await refundSmsCharge(campaign.organizationId, reservation.refere | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 104 | if (!messageId) throw new Error('Telnyx n’a pas renvoyé de message ID'); | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 107 | where: { telnyxMessageId: messageId }, | TBD | TBD | TBD |
| app\api\cron\campaign-worker\route.ts | 110 | telnyxMessageId: messageId, | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 5 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 16 | telnyxCallControlId: true, | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 29 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 34 | await telnyx.calls.actions.hangup(callLog.telnyxCallControlId, { command_id: randomUUID() }); | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 37 | failures.push(callLog.telnyxCallControlId); | TBD | TBD | TBD |
| app\api\cron\pstn-calls-timeout\route.ts | 38 | console.error("[PSTN Timeout] Unable to hang up overdue call", callLog.telnyxCallControlId, error); | TBD | TBD | TBD |
| app\api\cron\sequences\route.ts | 63 | telnyxMessageId: `sim-${Date.now()}-${Math.floor(Math.random()*1000)}`, | TBD | TBD | TBD |
| app\api\health\route.ts | 11 | * Après ajout d'autres services (Redis, Telnyx), ajouter des checks ici. | TBD | TBD | TBD |
| app\api\iot\policies\route.ts | 6 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\iot\policies\route.ts | 12 | // Call Telnyx API to create a traffic policy profile | TBD | TBD | TBD |
| app\api\iot\policies\route.ts | 13 | const res = await fetch("https://api.telnyx.com/v2/traffic_policy_profiles", { | TBD | TBD | TBD |
| app\api\iot\pwg-ticket\route.ts | 5 | // In a real application, this would send an email to Telnyx support, | TBD | TBD | TBD |
| app\api\iot\pwg-ticket\route.ts | 9 | console.log("Simulating PWG Ticket creation request to Telnyx Network team."); | TBD | TBD | TBD |
| app\api\iot\pwg-ticket\route.ts | 13 | message: "Ticket created. Telnyx support will reach out regarding VRF configuration." | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 26 | // 2. Fetch Telnyx SIMs (Real API) | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 27 | let telnyxSims: any[] = []; | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 28 | if (process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 29 | const res = await fetch("https://api.telnyx.com/v2/sim_cards", { | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 31 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 36 | telnyxSims = json.data &#124;&#124; []; | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 42 | const tSim = telnyxSims.find(s => s.id === localSim.telnyxSimId &#124;&#124; s.iccid === localSim.ic | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 44 | // Map Telnyx status or fallback to local | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 50 | // We could also fetch data usage per SIM via Telnyx SIM Card Data Usage endpoint, | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 51 | // but for this dashboard we use local mock or 0 if not available, since Telnyx Network | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 53 | // We will rely on local DB dataUsedMB for now, and real status from Telnyx. | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 65 | telnyxSimId: localSim.telnyxSimId | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 97 | // Order real eSIM via Telnyx | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 98 | let telnyxSimId = ""; | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 104 | if (!process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 105 | return NextResponse.json({ error: "Configuration API Telnyx manquante" }, { status: 500 }); | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 108 | // Call Telnyx API to purchase eSIM | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 109 | // Note: Telnyx charges $0.70 for an eSIM. | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 110 | const res = await fetch("https://api.telnyx.com/v2/actions/purchase/esims", { | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 113 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 123 | console.error("Telnyx eSIM Purchase Error:", err); | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 124 | return NextResponse.json({ error: "Erreur lors de la commande de l'eSIM chez Telnyx." }, { status: 5 | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 131 | telnyxSimId = esimData.id; | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 133 | activationCode = esimData.activation_code &#124;&#124; `LPA:1$smdp.plus.telnyx.com$${iccid}`; // fal | TBD | TBD | TBD |
| app\api\iot\sims\route.ts | 153 | telnyxSimId: telnyxSimId, | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 25 | // Map UI statuses to Telnyx actions | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 27 | const telnyxAction = targetStatus === 'ACTIVE' ? 'enable' : 'standby'; | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 30 | // Fetch SIMs to get their telnyxSimId | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 38 | if (!process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 39 | return NextResponse.json({ error: "Configuration API Telnyx manquante" }, { status: 500 }); | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 44 | if (!sim.telnyxSimId) throw new Error("No telnyxSimId"); | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 46 | const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId}/actions/${telnyxActi | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 49 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\iot\sims\bulk-toggle\route.ts | 56 | throw new Error(`Telnyx API error: ${err}`); | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 33 | // Call Telnyx API to enable Public IP | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 34 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 36 | const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId &#124;&#124; sim.id}/ | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 44 | console.error("Failed to assign public IP on Telnyx", await res.text()); | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 95 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 97 | const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId &#124;&#124; sim.id}/ | TBD | TBD | TBD |
| app\api\iot\sims\[id]\public-ip\route.ts | 105 | console.error("Failed to remove public IP on Telnyx", await res.text()); | TBD | TBD | TBD |
| app\api\iot\sims\[id]\toggle\route.ts | 20 | // MOCK TELNYX API : Appel simulé pour changer le statut chez l'opérateur | TBD | TBD | TBD |
| app\api\iot\sims\[id]\toggle\route.ts | 21 | // await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId}/actions/${newStatus === 'ACTI | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 33 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 35 | const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId &#124;&#124; sim.id}/ | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 43 | console.error("Failed to enable voice on Telnyx", await res.text()); | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 100 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 102 | const res = await fetch(`https://api.telnyx.com/v2/sim_cards/${sim.telnyxSimId &#124;&#124; sim.id}/ | TBD | TBD | TBD |
| app\api\iot\sims\[id]\voice\route.ts | 110 | console.error("Failed to disable voice on Telnyx", await res.text()); | TBD | TBD | TBD |
| app\api\omnichannel\send\route.ts | 20 | return NextResponse.json({ success: true, messageId: sent.message.telnyxMessageId, chargedAmount: se | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 3 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 36 | if (body.messagingProfileId && ![profile.id, profile.telnyxId].includes(body.messagingProfileId)) re | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 39 | // 2. Prepare Telnyx payload | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 40 | const telnyxPayload: any = { | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 45 | if (text) telnyxPayload.text = text; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 46 | if (mediaUrls && mediaUrls.length > 0) telnyxPayload.media_urls = mediaUrls; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 47 | telnyxPayload.messaging_profile_id = profile.telnyxId; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 48 | telnyxPayload.webhook_url = messagingWebhookUrl(); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 49 | telnyxPayload.use_profile_webhooks = true; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 50 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 52 | // 3. Débiter le prix configuré avant de consommer le service Telnyx. | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 54 | // panne réseau/5xx, le débit reste réservé car Telnyx a pu accepter le SMS. | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 67 | // 4. Send via Telnyx Node SDK | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 70 | messageResponse = await telnyx.messages.send(telnyxPayload, { maxRetries: 0 }); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 72 | console.error('[Telnyx SMS Send Error]', apiError.raw?.errors &#124;&#124; apiError.message); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 75 | await refundSmsCharge(phoneNumber.organizationId, reservation.reference, `Refus Telnyx ${status}`); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 79 | ? 'Telnyx a refusé le message. Le montant a été remboursé.' | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 85 | const telnyxMessageId = messageResponse.data?.id; | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 86 | if (!telnyxMessageId) { | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 89 | await confirmSmsCharge(reservation.reference, telnyxMessageId); | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 94 | where: { telnyxMessageId }, | TBD | TBD | TBD |
| app\api\sms\send\route.ts | 97 | telnyxMessageId: telnyxMessageId, | TBD | TBD | TBD |
| app\api\social-campaigns\route.ts | 91 | template: template.telnyxId | TBD | TBD | TBD |
| app\api\social-campaigns\route.ts | 92 | ? { template_id: template.telnyxId } | TBD | TBD | TBD |
| app\api\social-campaigns\route.ts | 101 | messageId: sent.message.telnyxMessageId, | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 2 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 4 | import { callControlApplicationPayload } from '@/lib/telnyx-voice-settings'; | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 10 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 15 | const response = await telnyxClient.callControlApplications.list({ | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 22 | console.error('Error fetching Telnyx applications:', error); | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 34 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 36 | const response = await telnyxClient.callControlApplications.create(callControlApplicationPayload(bod | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 40 | console.error('Error creating Telnyx application:', error); | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 54 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\applications\route.ts | 68 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\coverage\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\coverage\route.ts | 10 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\coverage\route.ts | 12 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\identity\lookup\route.ts | 2 | import { telnyx } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\identity\lookup\route.ts | 19 | // Number Lookup via Telnyx SDK | TBD | TBD | TBD |
| app\api\telecom\identity\lookup\route.ts | 21 | const response = await telnyx.numberLookup.retrieve(phoneNumber, { | TBD | TBD | TBD |
| app\api\telecom\identity\verify\check\route.ts | 19 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\check\route.ts | 23 | const url = `https://api.telnyx.com/v2/verifications/by_phone_number/${encodeURIComponent(phoneNumbe | TBD | TBD | TBD |
| app\api\telecom\identity\verify\profiles\route.ts | 28 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\profiles\route.ts | 29 | const response = await fetch(`https://api.telnyx.com/v2/verify_profiles`, { | TBD | TBD | TBD |
| app\api\telecom\identity\verify\profiles\route.ts | 77 | // We can fetch from local DB for speed, or from Telnyx. | TBD | TBD | TBD |
| app\api\telecom\identity\verify\templates\route.ts | 2 | import { telnyx } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\templates\route.ts | 12 | const response = await telnyx.verifyProfiles.retrieveTemplates(); | TBD | TBD | TBD |
| app\api\telecom\identity\verify\trigger\route.ts | 20 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\trigger\route.ts | 30 | url = 'https://api.telnyx.com/v2/verifications/dtmf_confirm'; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\trigger\route.ts | 32 | url = 'https://api.telnyx.com/v2/verifications/call'; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\trigger\route.ts | 34 | url = 'https://api.telnyx.com/v2/verifications/flashcall'; | TBD | TBD | TBD |
| app\api\telecom\identity\verify\trigger\route.ts | 36 | url = 'https://api.telnyx.com/v2/verifications/sms'; | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 16 | const telnyxPayload: any = { | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 24 | telnyxPayload.tools = tools; | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 25 | telnyxPayload.tool_choice = "auto"; | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 28 | const res = await fetch("https://api.telnyx.com/v2/ai/openai/chat/completions", { | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 31 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\inference\chat\route.ts | 34 | body: JSON.stringify(telnyxPayload), | TBD | TBD | TBD |
| app\api\telecom\inventory-coverage\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\inventory-coverage\route.ts | 8 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\inventory-coverage\route.ts | 10 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 4 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 23 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 24 | const response = await telnyx.messagingProfiles.create({ | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 28 | if (!response.data?.id) throw new Error('Missing Telnyx profile ID'); | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 30 | data: { telnyxId: response.data.id, name: name.trim(), webhookUrl, organizationId: session.user.orga | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\route.ts | 35 | return NextResponse.json({ error: 'Création non confirmée. Vérifiez les profils Telnyx avant de rées | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\[id]\route.ts | 12 | const { id: telnyxId } = await params; | TBD | TBD | TBD |
| app\api\telecom\messaging-profiles\[id]\route.ts | 15 | where: { telnyxId } | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 3 | import { getConfiguredTelnyxApiKey } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 7 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 13 | const apiKey = await getConfiguredTelnyxApiKey(); | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 25 | console.error('Error fetching Telnyx mobile push credentials:', error); | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 37 | const apiKey = await getConfiguredTelnyxApiKey(); | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 56 | console.error('Error creating Telnyx mobile push credential:', error); | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 68 | const apiKey = await getConfiguredTelnyxApiKey(); | TBD | TBD | TBD |
| app\api\telecom\mobile-push-credentials\route.ts | 89 | console.error('Error deleting Telnyx mobile push credential:', error); | TBD | TBD | TBD |
| app\api\telecom\numbers\route.ts | 16 | // eligibility. A softphone credential must never be able to choose another | TBD | TBD | TBD |
| app\api\telecom\numbers\route.ts | 30 | // The softphone polls this list: a cached answer would resurrect a | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 15 | // We expect payload to match Telnyx Advanced Order structure | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 16 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 17 | const response = await fetch(`https://api.telnyx.com/v2/advanced_orders`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 39 | telnyxOrderId: data.data.id, | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 62 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\advanced-orders\route.ts | 63 | const response = await fetch(`https://api.telnyx.com/v2/advanced_orders`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 15 | // We expect payload to match Telnyx Inexplicit Number Order structure | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 18 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 19 | const response = await fetch(`https://api.telnyx.com/v2/inexplicit_number_orders`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 41 | telnyxOrderId: data.data.id, | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 64 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\bulk-orders\route.ts | 65 | const response = await fetch(`https://api.telnyx.com/v2/inexplicit_number_orders`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 5 | import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 15 | TELNYX_API_KEY_NOT_CONFIGURED: 503, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 16 | TELNYX_VOICE_CONNECTION_NOT_CONFIGURED: 503, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 17 | TELNYX_NUMBER_AVAILABILITY_FAILED: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 18 | TELNYX_NUMBER_PRICE_UNAVAILABLE: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 19 | TELNYX_NUMBER_ORDER_REJECTED: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 20 | TELNYX_ORDER_RESULT_UNKNOWN: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 21 | TELNYX_ORDER_ID_MISSING: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 22 | TELNYX_NUMBER_ROUTING_FAILED: 502, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 40 | const result = await purchaseTelnyxNumber({ | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 57 | : `Commande Telnyx acceptée pour ${result.phoneNumber}. Activation en cours.`, | TBD | TBD | TBD |
| app\api\telecom\numbers\buy\route.ts | 66 | console.error("[Telnyx Number Purchase]", error); | TBD | TBD | TBD |
| app\api\telecom\numbers\orders\[id]\requirements\route.ts | 12 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\orders\[id]\requirements\route.ts | 15 | const response = await fetch(`https://api.telnyx.com/v2/sub_number_orders/${id}`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\orders\[id]\requirements\route.ts | 44 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\orders\[id]\requirements\route.ts | 47 | const response = await fetch(`https://api.telnyx.com/v2/sub_number_orders/${id}`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\route.ts | 2 | import { telnyx } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\route.ts | 24 | // Make request via Telnyx Node SDK | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\route.ts | 25 | const response = await telnyx.numberReservations.create(payload); | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\route.ts | 47 | const response = await telnyx.numberReservations.list({ | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\[id]\extend\route.ts | 13 | // The Telnyx Node SDK might not have a direct helper for `extend`, | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\[id]\extend\route.ts | 15 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\numbers\reservations\[id]\extend\route.ts | 17 | const response = await fetch(`https://api.telnyx.com/v2/number_reservations/${id}/actions/extend`, { | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 4 | import { resellerNumberPrice } from "@/lib/telnyx-number-pricing"; | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 6 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 36 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 39 | return NextResponse.json({ error: "TELNYX_API_KEY_NOT_CONFIGURED" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 100 | console.error("[Telnyx Search Error]", response.status, upstream.slice(0, 500)); | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 102 | { error: "TELNYX_NUMBER_SEARCH_FAILED" }, | TBD | TBD | TBD |
| app\api\telecom\numbers\search\route.ts | 107 | console.error("[Telnyx Search Error]", error); | TBD | TBD | TBD |
| app\api\telecom\numbers\[id]\route.ts | 4 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\numbers\[id]\route.ts | 17 | providerProfileId = profile.telnyxId; | TBD | TBD | TBD |
| app\api\telecom\numbers\[id]\route.ts | 19 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\numbers\[id]\route.ts | 20 | await telnyx.phoneNumbers.messaging.update(number.telnyxId, { messaging_profile_id: providerProfileI | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 2 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 4 | import { outboundVoiceProfilePayload } from '@/lib/telnyx-voice-settings'; | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 10 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 15 | const response = await telnyxClient.outboundVoiceProfiles.list({ | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 22 | console.error('Error fetching Telnyx outbound voice profiles:', error); | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 34 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 35 | const response = await telnyxClient.outboundVoiceProfiles.create(outboundVoiceProfilePayload(await r | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 39 | console.error('Error creating Telnyx outbound voice profile:', error); | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 53 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\outbound-profiles\route.ts | 67 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\porting\check\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\check\route.ts | 7 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\check\route.ts | 9 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 8 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 10 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 46 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 48 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 75 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 77 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 110 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\route.ts | 112 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\activate\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\activate\route.ts | 10 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\activate\route.ts | 12 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\cancel\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\cancel\route.ts | 10 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\cancel\route.ts | 12 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\comments\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\comments\route.ts | 11 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\comments\route.ts | 13 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\comments\route.ts | 41 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\comments\route.ts | 43 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\foc-dates\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\foc-dates\route.ts | 10 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\foc-dates\route.ts | 12 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\submit\route.ts | 3 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\submit\route.ts | 10 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\telecom\porting\orders\[id]\submit\route.ts | 12 | return NextResponse.json({ success: false, error: 'TELNYX_API_KEY not configured' }, { status: 500 } | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 52 | // Call Telnyx API | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 53 | const response = await fetch('https://api.telnyx.com/v2/messages/rcs', { | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 57 | 'Authorization': `Bearer ${process.env.TELNYX_API_KEY}` | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 65 | return NextResponse.json({ error: 'Telnyx API Error', details: data }, { status: response.status }); | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 74 | telnyxMessageId: data.data.id, | TBD | TBD | TBD |
| app\api\telecom\rcs\send\route.ts | 87 | return NextResponse.json({ success: true, message: smsMessage, telnyxData: data.data }); | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 4 | import { telnyx } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 34 | // Optional: If linking profile to RCS Agent at Telnyx level | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 38 | await fetch(`https://api.telnyx.com/v2/rcs_agents/${agentId}`, { | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 42 | 'Authorization': `Bearer ${process.env.TELNYX_API_KEY}` | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 48 | } catch (telnyxErr) { | TBD | TBD | TBD |
| app\api\telecom\rcs\settings\route.ts | 49 | console.warn("Telnyx RCS Agent Link failed (might be pending approval):", telnyxErr); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 2 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 4 | import { credentialConnectionPayload } from '@/lib/telnyx-voice-settings'; | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 10 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 15 | const response = await telnyxClient.credentialConnections.list({ | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 22 | console.error('Error fetching Telnyx SIP connections:', error); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 34 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 35 | const response = await telnyxClient.credentialConnections.create(credentialConnectionPayload(await r | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 39 | console.error('Error creating Telnyx SIP connection:', error); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 53 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\sip-connections\route.ts | 67 | const client = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 2 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 9 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 20 | const response = await telnyxClient.telephonyCredentials.list({ filter } as any); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 24 | console.error('Error fetching Telnyx telephony credentials:', error); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 36 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 55 | const response = await telnyxClient.telephonyCredentials.create(payload); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 59 | console.error('Error creating Telnyx telephony credential:', error); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 71 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 86 | const response = await telnyxClient.telephonyCredentials.update(id, payload); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 90 | console.error('Error updating Telnyx telephony credential:', error); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 102 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 110 | const response = await telnyxClient.telephonyCredentials.del(id); | TBD | TBD | TBD |
| app\api\telecom\telephony-credentials\route.ts | 114 | console.error('Error deleting Telnyx telephony credential:', error); | TBD | TBD | TBD |
| app\api\telecom\token\route.ts | 2 | export { GET, dynamic } from '../../telnyx/token/route'; | TBD | TBD | TBD |
| app\api\telecom\tts\route.ts | 17 | if (!process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\telecom\tts\route.ts | 18 | return NextResponse.json({ error: "Telnyx API key not configured" }, { status: 500 }); | TBD | TBD | TBD |
| app\api\telecom\tts\route.ts | 40 | const response = await fetch("https://api.telnyx.com/v2/text-to-speech", { | TBD | TBD | TBD |
| app\api\telecom\tts\route.ts | 43 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\tts\route.ts | 51 | console.error("[Telnyx TTS Error]", errorData); | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 2 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 9 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 14 | const response = await telnyxClient.uacConnections.list({ | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 21 | console.error('Error fetching Telnyx UAC connections:', error); | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 33 | const telnyxClient = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 56 | const response = await telnyxClient.uacConnections.create(payload); | TBD | TBD | TBD |
| app\api\telecom\uac-connections\route.ts | 60 | console.error('Error creating Telnyx UAC connection:', error); | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 11 | if (!process.env.TELNYX_API_KEY) { | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 12 | return NextResponse.json({ error: "Telnyx API key not configured" }, { status: 500 }); | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 15 | const response = await fetch("https://api.telnyx.com/v2/voice_clones", { | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 17 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 43 | const response = await fetch("https://api.telnyx.com/v2/voice_clones", { | TBD | TBD | TBD |
| app\api\telecom\voice-clones\route.ts | 46 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\voice-clones\upload\route.ts | 11 | // This route handles multipart/form-data directly and forwards it to Telnyx | TBD | TBD | TBD |
| app\api\telecom\voice-clones\upload\route.ts | 14 | // We can directly send this FormData to Telnyx! | TBD | TBD | TBD |
| app\api\telecom\voice-clones\upload\route.ts | 16 | const response = await fetch("https://api.telnyx.com/v2/voice_clones/from_upload", { | TBD | TBD | TBD |
| app\api\telecom\voice-clones\upload\route.ts | 19 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\voice-designs\route.ts | 13 | const response = await fetch("https://api.telnyx.com/v2/voice_designs", { | TBD | TBD | TBD |
| app\api\telecom\voice-designs\route.ts | 16 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telecom\voice-designs\[id]\sample\route.ts | 16 | const response = await fetch(`https://api.telnyx.com/v2/voice_designs/${id}/sample`, { | TBD | TBD | TBD |
| app\api\telecom\voice-designs\[id]\sample\route.ts | 19 | "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`, | TBD | TBD | TBD |
| app\api\telnyx\active-call\route.ts | 10 | * GET /api/telnyx/active-call | TBD | TBD | TBD |
| app\api\telnyx\active-call\route.ts | 63 | callControlId: callLog.telnyxCallControlId, | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 2 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 15 | * POST /api/telnyx/answer | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 16 | * Répond à un appel PSTN entrant via l'API Telnyx Call Control. | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 18 | * le SDK Telnyx WebRTC natif n'a pas reçu l'event SIP. | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 26 | *  - un second answer sur un appel déjà muté est rejeté par Telnyx → 409. | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 43 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 80 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 82 | await telnyx.calls.actions.answer(callControlId, { command_id: crypto.randomUUID() }); | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 91 | console.log(`[Telnyx Answer] Call ${callControlId} answered via API`); | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 96 | // La commande Telnyx a été refusée (double answer / appel déjà terminé / état incohérent). | TBD | TBD | TBD |
| app\api\telnyx\answer\route.ts | 99 | console.error("[Telnyx Answer Error]", error instanceof Error ? error.message : error); | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 2 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 15 | * POST /api/telnyx/hangup | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 16 | * Raccroche / refuse un appel PSTN via l'API Telnyx Call Control. | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 18 | * Sécurité (mêmes règles que /api/telnyx/answer) : | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 23 | *  - un second hangup est rejeté par Telnyx → 409. | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 40 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 73 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 75 | await telnyx.calls.actions.hangup(callControlId, { command_id: crypto.randomUUID() }); | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 84 | console.log(`[Telnyx Hangup] Call ${callControlId} hung up via API`); | TBD | TBD | TBD |
| app\api\telnyx\hangup\route.ts | 91 | console.error("[Telnyx Hangup Error]", error instanceof Error ? error.message : error); | TBD | TBD | TBD |
| app\api\telnyx\preauthorize\route.ts | 58 | telnyxCallControlId: provisionalControlId, | TBD | TBD | TBD |
| app\api\telnyx\preauthorize\cancel\route.ts | 19 | telnyxCallControlId: callControlId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 8 | const API_BASE = "https://api.telnyx.com/v2"; | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 16 | select: { telnyxTelephonyCredentialId: true, telnyxCredentialConnectionId: true }, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 18 | if (user?.telnyxTelephonyCredentialId && | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 19 | !user.telnyxTelephonyCredentialId.startsWith("provisioning:") && | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 20 | user.telnyxCredentialConnectionId === connectionId) { | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 21 | return user.telnyxTelephonyCredentialId; | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 37 | select: { telnyxApiKey: true, telnyxConnectionId: true }, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 45 | telnyxTelephonyCredentialId: true, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 46 | telnyxCredentialConnectionId: true, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 52 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 53 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 55 | return NextResponse.json({ error: "TELNYX_WEBRTC_NOT_CONFIGURED" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 64 | console.error("Configured Telnyx connection unavailable", connectionResponse.status); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 65 | return NextResponse.json({ error: "TELNYX_CONNECTION_UNAVAILABLE" }, { status: 502 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 68 | if (!connection?.active) return NextResponse.json({ error: "TELNYX_CONNECTION_INACTIVE" }, { status: | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 70 | let credentialId = user.telnyxTelephonyCredentialId; | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 73 | user.telnyxCredentialConnectionId === connectionId; | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 76 | if (credentialId?.startsWith("provisioning:") && user.telnyxCredentialConnectionId === connectionId) | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 79 | return NextResponse.json({ error: "TELNYX_CREDENTIAL_PROVISIONING" }, { status: 409 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 83 | const previousConnectionId = user.telnyxCredentialConnectionId; | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 88 | telnyxTelephonyCredentialId: previousCredentialId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 89 | telnyxCredentialConnectionId: previousConnectionId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 91 | data: { telnyxTelephonyCredentialId: claim, telnyxCredentialConnectionId: connectionId }, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 95 | if (!credentialId) return NextResponse.json({ error: "TELNYX_CREDENTIAL_PROVISIONING" }, { status: 4 | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 103 | name: `softphone-${user.id}`, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 109 | throw new Error(`TELNYX_CREDENTIAL_CREATE_FAILED_${createResponse.status}`); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 115 | telnyxTelephonyCredentialId: credentialId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 116 | telnyxCredentialConnectionId: connectionId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 126 | }).catch((error) => console.warn("Unable to remove rotated Telnyx credential", error)); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 130 | where: { id: user.id, telnyxTelephonyCredentialId: claim }, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 132 | telnyxTelephonyCredentialId: previousCredentialId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 133 | telnyxCredentialConnectionId: previousConnectionId, | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 143 | return NextResponse.json({ error: "TELNYX_WEBRTC_CREDENTIAL_MISSING" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 152 | console.error("Failed to generate Telnyx WebRTC token", tokenResponse.status, upstream.slice(0, 300) | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 153 | return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_FAILED" }, { status: 502 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 156 | if (!token) return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_EMPTY" }, { status: 502 }); | TBD | TBD | TBD |
| app\api\telnyx\token\route.ts | 161 | return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_UNAVAILABLE" }, { status: 503 }); | TBD | TBD | TBD |
| app\api\video\rooms\route.ts | 4 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\video\rooms\route.ts | 8 | const res = await fetch("https://api.telnyx.com/v2/rooms", { | TBD | TBD | TBD |
| app\api\video\rooms\route.ts | 29 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\video\rooms\route.ts | 34 | const res = await fetch("https://api.telnyx.com/v2/rooms", { | TBD | TBD | TBD |
| app\api\video\rooms\[id]\token\route.ts | 7 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\api\video\rooms\[id]\token\route.ts | 14 | // https://developers.telnyx.com/api-reference/rooms-client-tokens/create-client-token-to-join-a-roo | TBD | TBD | TBD |
| app\api\video\rooms\[id]\token\route.ts | 15 | const res = await fetch(`https://api.telnyx.com/v2/rooms/${id}/actions/generate_join_client_token`,  | TBD | TBD | TBD |
| app\api\voicemails\[id]\audio\route.ts | 4 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\api\voicemails\[id]\audio\route.ts | 20 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\voicemails\[id]\audio\route.ts | 21 | const recording = await telnyx.recordings.retrieve(call.voicemailRecordingId); | TBD | TBD | TBD |
| app\api\webhooks\ecommerce\abandoned-cart\route.ts | 111 | // Inject the business context only after Telnyx confirms queueing. | TBD | TBD | TBD |
| app\api\webhooks\email\route.ts | 72 | telnyxMessageId: messageId, | TBD | TBD | TBD |
| app\api\webhooks\instagram\route.ts | 76 | telnyxMessageId: mid, // On utilise le mid d'Instagram | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 2 | import { getConfiguredTelnyxClient, getConfiguredTelnyxConnectionId, getConfiguredTelnyxPublicKey }  | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 10 | import { activateFulfilledTelnyxOrder } from '@/lib/telnyx-number-purchase'; | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 14 | classifyTelnyxCallInitiated, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 15 | isTelnyxTransferChildLeg, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 16 | buildTelnyxTransferClientState, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 17 | buildTelnyxTransferCommandId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 18 | TELNYX_TRANSFER_KIND, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 19 | } from '@/lib/telnyx-call-routing'; | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 37 | select: { id: true, telnyxCallControlId: true, direction: true }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 40 | source.telnyxCallControlId === params.sourceCallControlId && | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 49 | *    Telnyx de la jambe B fait partie de l'infrastructure AI ; jamais de | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 51 | *  - `parentCallLogId` @unique + `telnyxCallControlId` @unique → P2002 = | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 69 | select: { id: true, telnyxCallControlId: true, organizationId: true, phoneNumberId: true, fromNumber | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 71 | if (!source &#124;&#124; source.telnyxCallControlId !== sourceCallControlId) { | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 72 | console.error(`[TELNYX_TRANSFER_SOURCE_UNVERIFIED] ${callControlId} — jambe enfant ignorée (fail-clo | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 80 | telnyxCallControlId: callControlId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 94 | console.log(`[TELNYX_TRANSFER_CHILD_CREATED] ${callControlId} parent=${source.id} org=${source.organ | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 103 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 104 | await telnyx.calls.actions.hangup(callControlId, { command_id: crypto.randomUUID() }); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 106 | console.error(`[Telnyx Webhook] Unable to terminate ${callControlId} (${reason})`, error); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 145 | console.error(`[Telnyx Webhook] Preauthorization failed for ${params.callControlId}`, error); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 206 | data: { provider: 'TELNYX', eventId, type: event.event_type }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 211 | console.log(`[Telnyx Webhook] Duplicate event ignored: ${eventId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 231 | where: { telnyxMessageId: payload.id }, update: {}, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 233 | telnyxMessageId: payload.id, organizationId: number.organizationId, phoneNumberId: number.id, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 242 | console.error(`[Telnyx Webhook] Invalid call_control_id for ${eventType}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 252 | throw new Error(`Invalid Telnyx number order event: ${eventType}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 257 | where: { telnyxOrderId: orderId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 261 | if (fulfilled) await activateFulfilledTelnyxOrder(orderId); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 268 | throw new Error(`Invalid Telnyx verification event: ${eventType}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 281 | console.log(`[Telnyx Webhook] Call Initiated from ${from} to ${to}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 288 | console.log(`[TELNYX_CALL_ROUTING_CLASSIFIED] kind=${kind} direction=incoming call_control_id=${call | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 292 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 295 | telnyxCallControlId: callControlId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 351 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 352 | await telnyx.calls.actions.answer(callControlId, { command_id: crypto.randomUUID() }); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 420 | // Le SIP WebRTC natif (Telnyx SDK) reste le canal de média principal. | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 431 | const expectedConnectionId = await getConfiguredTelnyxConnectionId(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 447 | clientState && clientState.kind === TELNYX_TRANSFER_KIND && | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 459 | const routedKind = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 469 | `[TELNYX_CALL_ROUTING_CLASSIFIED] kind=${routedKind} direction=outgoing ` + | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 481 | console.error(`[TELNYX_UNCLASSIFIED_OUTBOUND] ${callControlId} — aucune action`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 491 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 499 | telnyxCallControlId: provisionalId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 512 | telnyxCallControlId: callControlId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 525 | telnyxCallControlId: callControlId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 556 | console.log(`[Telnyx Webhook] Call Answered: ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 560 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 566 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 580 | if (isTelnyxTransferChildLeg(callLog)) { | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 611 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 614 | console.error(`[Telnyx Webhook] LIVEKIT_SIP_URI missing for AI call ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 640 | console.log(`[Telnyx Webhook] Transferring call ${callControlId} to LiveKit SIP: ${livekitSipUri}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 647 | // fenêtre Telnyx (min 30) et aligné sur la limite du plan. | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 651 | const targetClientState = buildTelnyxTransferClientState({ | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 658 | const sourceClientState = buildTelnyxTransferClientState({ | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 667 | await telnyx.calls.actions.transfer(callControlId, { | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 671 | // Telnyx, double webhook) réutilise la MÊME commande → dédup. | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 672 | command_id: buildTelnyxTransferCommandId({ | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 682 | console.error(`[Telnyx Webhook] LiveKit transfer failed for ${callControlId}`, error); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 714 | const callLog = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } }); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 729 | console.log(`[Telnyx Webhook] Call terminal (${eventType}): ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 733 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 747 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 802 | // automatisation, ni notification Pusher — le coût Telnyx de cette jambe | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 804 | if (isTelnyxTransferChildLeg(callLog)) { | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 814 | const parent = await prisma.callLog.findUnique({ where: { id: callLog.parentCallLogId }, select: { t | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 815 | if (parent) await terminateProviderCall(parent.telnyxCallControlId, 'FORWARD_NO_ANSWER'); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 891 | console.error('[Telnyx Webhook] settlePstnCall failed', billingErr); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 905 | console.error('[Telnyx Webhook] releasePstnReservation failed', relErr); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 913 | // Telnyx confirme le hangup. Idempotent côté client (comparaison du | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 937 | console.error(`[Telnyx Webhook] pstn:ended failed for ${callControlId}`, notifyErr); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 951 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 980 | console.log(`[Telnyx Webhook] Recording saved for ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 990 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 998 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1001 | console.log(`[Telnyx Webhook] Transcription appended for ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1010 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1013 | console.log(`[Telnyx Webhook] AMD Result for ${callControlId}: ${result}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1022 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1025 | console.log(`[Telnyx Webhook] AI Summary saved for ${callControlId}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1032 | console.log(`[Telnyx Webhook] AI Conversation ended for ${callControlId} (Reason: ${reason})`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1058 | console.log(`[Telnyx Webhook] ${msgType} Received from ${fromNumber} to ${toNumber}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1067 | where: { telnyxMessageId: messageId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1070 | telnyxMessageId: messageId, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1104 | console.log(`[Telnyx Webhook] Message ${messageId} sent to carrier`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1106 | where: { telnyxMessageId: messageId, status: { in: ['PENDING', 'QUEUED', 'IN_FLIGHT', 'SENDING'] } } | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1117 | console.log(`[Telnyx Webhook] Message ${messageId} finalized with status: ${status}`); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1124 | where: { telnyxMessageId: messageId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1151 | // A failed claim is removed so Telnyx can safely retry the event. All | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1155 | where: { provider: 'TELNYX', eventId }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1158 | console.error('[Telnyx Webhook Async Error]', error); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1168 | const signature = req.headers.get('telnyx-signature-ed25519'); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1169 | const timestamp = req.headers.get('telnyx-timestamp'); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1172 | publicKey = await getConfiguredTelnyxPublicKey(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1174 | console.error('[Telnyx Webhook] Telnyx public key is not configured in God Mode or environment'); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1178 | return new NextResponse('Missing Telnyx signature', { status: 401 }); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1181 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1182 | event = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey).data; | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1184 | console.error('[Telnyx Webhook] Signature verification failed:', err.message); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1194 | `[TELNYX_UNSUPPORTED_WEBHOOK_VERSION] event_type=${v1EventType} — enveloppe v2 exigée`, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1197 | { error: 'TELNYX_WEBHOOK_V2_REQUIRED' }, | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1201 | return new NextResponse('Invalid Telnyx event', { status: 400 }); | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1205 | // Telnyx retry; the WebhookEvent claim makes successful retries idempotent. | TBD | TBD | TBD |
| app\api\webhooks\telecom\route.ts | 1210 | console.error('[Telnyx Webhook Error]', error); | TBD | TBD | TBD |
| app\api\webhooks\telecom\inbound\route.ts | 1 | /** Legacy URL kept for already-configured Telnyx applications. */ | TBD | TBD | TBD |
| app\api\webhooks\telecom\numbers\route.ts | 1 | // Compatibility endpoint: all Telnyx callbacks use the same signed, | TBD | TBD | TBD |
| app\api\webhooks\telecom\verify\route.ts | 1 | // Compatibility endpoint: all Telnyx callbacks use the same signed, | TBD | TBD | TBD |
| app\api\webhooks\telecom\voice\route.ts | 1 | /** Legacy URL kept for already-configured Telnyx applications. */ | TBD | TBD | TBD |
| app\api\webhooks\voice\inbound\route.ts | 1 | /** Legacy URL kept for already-configured Telnyx applications. */ | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 7 | import { getConfiguredTelnyxApiKey, getConfiguredTelnyxClient, getConfiguredTelnyxPublicKey } from " | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 17 | const signature = req.headers.get('telnyx-signature-ed25519'); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 18 | const timestamp = req.headers.get('telnyx-timestamp'); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 19 | if (!signature &#124;&#124; !timestamp) return new NextResponse('Missing Telnyx signature', { status | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 22 | const [telnyx, publicKey] = await Promise.all([ | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 23 | getConfiguredTelnyxClient(), | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 24 | getConfiguredTelnyxPublicKey(), | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 26 | eventData = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey).data; | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 29 | return new NextResponse('Invalid Telnyx signature', { status: 401 }); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 33 | return new NextResponse('Invalid Telnyx event', { status: 400 }); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 37 | data: { provider: 'TELNYX_WHATSAPP', eventId: eventData.id, type: eventData.event_type }, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 49 | const telnyxMessageId = payloadInfo.id; | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 99 | where: { telnyxMessageId }, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 102 | telnyxMessageId: telnyxMessageId, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 119 | messageId: telnyxMessageId, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 293 | const telnyxApiKey = await getConfiguredTelnyxApiKey(); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 295 | headers: { Authorization: `Bearer ${telnyxApiKey}` }, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 297 | if (!mediaRes.ok) throw new Error(`Téléchargement média Telnyx refusé (${mediaRes.status}).`); | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 420 | // faux data URI que Telnyx/WhatsApp refuserait. | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 446 | const telnyxMessageId = payloadInfo.id; | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 449 | if (typeof telnyxMessageId !== 'string' &#124;&#124; typeof status !== 'string') { | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 457 | where: { telnyxMessageId } | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 481 | where: { messageId: telnyxMessageId } | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 512 | where: { provider: 'TELNYX_WHATSAPP', eventId: claimedEventId }, | TBD | TBD | TBD |
| app\api\webhooks\whatsapp\route.ts | 516 | // A non-2xx response is intentional: Telnyx can retry and the durable claim | TBD | TBD | TBD |
| app\api\whatsapp\link-account\route.ts | 8 | error: 'Cette route d’inscription non vérifiée a été retirée. Utilisez God Mode → WhatsApp pour attr | TBD | TBD | TBD |
| app\api\whatsapp\link-account\route.ts | 9 | code: 'USE_TELNYX_WHATSAPP_CONTROL', | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 2 | /* eslint-disable @typescript-eslint/no-explicit-any -- Telnyx template components are a generated p | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 5 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 11 | const message = error?.raw?.errors?.[0]?.detail &#124;&#124; error?.message &#124;&#124; 'Erreur Tel | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 12 | return NextResponse.json({ error: message, code: 'TELNYX_WHATSAPP_ERROR' }, { status: status >= 400  | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 46 | const telnyxId = typeof item?.id === 'string' ? item.id : null; | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 48 | telnyxId, | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 58 | if (telnyxId) { | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 60 | where: { telnyxId }, | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 83 | return NextResponse.json({ error: 'Activez et attribuez d’abord un compte WhatsApp Telnyx.' }, { sta | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 85 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 86 | const response = await telnyx.whatsapp.templates.create({ | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 93 | if (!response?.data?.id) return NextResponse.json({ error: 'Telnyx n’a pas confirmé la création du m | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 111 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\whatsapp\templates\route.ts | 113 | for await (const item of telnyx.whatsapp.templates.list({ 'filter[waba_id]': account.wabaId })) { | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 2 | /* eslint-disable @typescript-eslint/no-explicit-any -- Telnyx template components are a generated p | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 5 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 11 | const message = error?.raw?.errors?.[0]?.detail &#124;&#124; error?.message &#124;&#124; 'Erreur Tel | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 12 | return NextResponse.json({ error: message, code: 'TELNYX_WHATSAPP_ERROR' }, { status: status >= 400  | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 21 | if (!template.telnyxId) return { response: NextResponse.json({ error: 'Ce modèle local n’est pas lié | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 45 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 46 | const remote = await telnyx.whatsappMessageTemplates.retrieve(result.template.telnyxId); | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 47 | if (!remote.data) return NextResponse.json({ error: 'Telnyx n’a pas renvoyé le modèle.' }, { status: | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 71 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 72 | const remote = await telnyx.whatsappMessageTemplates.update(result.template.telnyxId, { | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 76 | if (!remote.data) return NextResponse.json({ error: 'Telnyx n’a pas confirmé la modification.' }, {  | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 94 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\whatsapp\templates\[id]\route.ts | 95 | await telnyx.whatsappMessageTemplates.delete(result.template.telnyxId); | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 17 | const API_BASE = 'https://api.telnyx.com/v2'; | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 29 | select: { telnyxApiKey: true, telnyxConnectionId: true }, | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 31 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 32 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 34 | return NextResponse.json({ error: 'TELNYX_VOICE_NOT_CONFIGURED' }, { status: 503 }); | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 88 | telnyxCallControlId: provisionalControlId, | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 136 | // Dédup Telnyx 60 s : un retry du même appel logique ne crée | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 144 | throw new Error(responseBody?.errors?.[0]?.detail &#124;&#124; `TELNYX_DIAL_FAILED_${response.status | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 149 | data: { telnyxCallControlId: callControlId, status: 'INITIATED' }, | TBD | TBD | TBD |
| app\api\workers\dialer\route.ts | 152 | const existing = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } }); | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 4 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 33 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 43 | response = await telnyx.messages.send({ | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 45 | messaging_profile_id: number.messagingProfile.telnyxId, | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 50 | if (status >= 400 && status < 500) await refundSmsCharge(orgId, reservation.reference, `Refus Telnyx | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 53 | if (!response.data?.id) throw new Error('Missing Telnyx message ID'); | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 55 | const sms = await prisma.smsMessage.upsert({ where: { telnyxMessageId: response.data.id }, update: { | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 56 | telnyxMessageId: response.data.id, organizationId: orgId, phoneNumberId: number.id, | TBD | TBD | TBD |
| app\api\workers\sms\route.ts | 63 | return NextResponse.json({ error: 'Envoi non confirmé. Vérifiez Telnyx avant toute nouvelle tentativ | TBD | TBD | TBD |
| app\buy-test\page.tsx | 201 | <p>Recherche de numéros premium chez Telnyx...</p> | TBD | TBD | TBD |
| app\dashboard\DashboardSidebar.tsx | 74 | { name: t("dashboard.softphone"), href: "/dashboard/softphone", icon: Phone }, | TBD | TBD | TBD |
| app\dashboard\page.tsx | 164 | <p className="text-xs text-[var(--text-secondary)] mt-1">OpenAI + Telnyx combinés</p> | TBD | TBD | TBD |
| app\dashboard\admin\AdminSettingsClient.tsx | 136 | La clé maître et le routage Telnyx sont gérés exclusivement dans <a href="/god-mode/telnyx" classNam | TBD | TBD | TBD |
| app\dashboard\analytics\page.tsx | 68 | // Cost: Telnyx/Twilio cost approx 0.05€ per call/msg | TBD | TBD | TBD |
| app\dashboard\calls\page.tsx | 9 | telnyxCallControlId: string; | TBD | TBD | TBD |
| app\dashboard\calls\page.tsx | 162 | ID: {selectedCall.telnyxCallControlId} | TBD | TBD | TBD |
| app\dashboard\channels\ChannelsClient.tsx | 42 | Powered by Telnyx Messaging API | TBD | TBD | TBD |
| app\dashboard\iot\page.tsx | 409 | alert("Politique créée chez Telnyx !"); | TBD | TBD | TBD |
| app\dashboard\iot\page.tsx | 427 | alert("Une demande a été envoyée au support Telnyx. Ils vous contacteront pour configurer le VPN Clo | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 7 | * Provisions a LiveKit tenant on Telnyx's platform. | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 8 | * Makes a POST to https://<region>.livekit-telnyx.com/provision | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 15 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 16 | if (!apiKey) return { error: "TELNYX_API_KEY is not configured" }; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 18 | const url = `https://${region}.livekit-telnyx.com/provision`; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 46 | * Bridges a Telnyx Phone Number to a LiveKit Region. | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 56 | const apiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 57 | if (!apiKey) return { error: "TELNYX_API_KEY is not configured" }; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 65 | if (!phone.telnyxId) return { error: "Phone number is missing Telnyx ID" }; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 69 | const fqdnRes = await fetch("https://api.telnyx.com/v2/fqdn_connections", { | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 88 | const sipFqdn = `${region}.sip.livekit-telnyx.com`; | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 89 | const addFqdnRes = await fetch("https://api.telnyx.com/v2/fqdns", { | TBD | TBD | TBD |
| app\dashboard\livekit\actions.ts | 110 | const patchPhoneRes = await fetch(`https://api.telnyx.com/v2/phone_numbers/${phone.telnyxId}`, { | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 58 | LiveKit sur Telnyx | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 62 | Déployez vos agents d'IA vocale codés en Python directement sur l'infrastructure de Telnyx pour une  | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 99 | <p className="text-sm text-[var(--text-secondary)]">Enregistrez votre projet sur la plateforme Telny | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 139 | <p className="text-sm text-[var(--text-secondary)]">Associez un numéro de téléphone Telnyx à un serv | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 186 | "name": "telnyx-inbound", | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 216 | <p className="text-sm text-[var(--text-secondary)]">Sauvegardez ce code dans <code>agent.py</code>,  | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 221 | from livekit.plugins import openai, silero, telnyx | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 234 | stt=telnyx.STT( | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 236 | base_url="wss://api.telnyx.com/v2/speech-to-text/transcription", | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 238 | llm=openai.LLM.with_telnyx(model="zai-org/GLM-5.1-FP8"), | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 239 | tts=telnyx.TTS(voice="Telnyx.NaturalHD.astra", sample_rate=24000), | TBD | TBD | TBD |
| app\dashboard\livekit\LiveKitClient.tsx | 251 | # lk agent deploy . --secrets TELNYX_API_KEY=$TELNYX_API_KEY | TBD | TBD | TBD |
| app\dashboard\messages\actions.ts | 5 | import { telnyx } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\dashboard\messages\actions.ts | 86 | // 1. Send via Telnyx | TBD | TBD | TBD |
| app\dashboard\messages\actions.ts | 87 | const response = await telnyx.messages.create({ | TBD | TBD | TBD |
| app\dashboard\messages\actions.ts | 96 | telnyxMessageId: response.data.id &#124;&#124; `pending_${Date.now()}`, | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 5 | import { telnyx } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 7 | import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 89 | // `organizationId`, `status`, `number` and `telnyxId` are untouched. | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 113 | const response = await telnyx.availablePhoneNumbers.list({ | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 124 | return { error: "Failed to fetch numbers from Telnyx" }; | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 131 | * Delegates to `purchaseTelnyxNumber`, which debits the wallet, records the | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 132 | * Telnyx order, provisions the number and assigns it to the buyer. Writing the | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 133 | * `PhoneNumber` row here directly used to fabricate a `telnyxId` | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 135 | * keyed on `telnyxId` and left the number impossible to attribute. | TBD | TBD | TBD |
| app\dashboard\numbers\actions.ts | 150 | const result = await purchaseTelnyxNumber({ | TBD | TBD | TBD |
| app\dashboard\numbers\buy\page.tsx | 210 | {errorMsg === "No Telnyx API key configured" | TBD | TBD | TBD |
| app\dashboard\numbers\buy\page.tsx | 211 | ? "Clé API Telnyx manquante. Veuillez la configurer dans vos paramètres pour rechercher des numéros. | TBD | TBD | TBD |
| app\dashboard\numbers\buy\page.tsx | 220 | <p>Recherche de numéros premium chez Telnyx...</p> | TBD | TBD | TBD |
| app\dashboard\settings\actions.ts | 3 | export async function saveTelnyxKey(_key: string) { | TBD | TBD | TBD |
| app\dashboard\settings\actions.ts | 4 | return { error: "La clé Telnyx est gérée centralement dans God Mode et ne peut pas être définie par  | TBD | TBD | TBD |
| app\dashboard\settings\TelnyxKeyForm.tsx | 1 | export function TelnyxKeyForm({ defaultValue: _defaultValue }: { defaultValue: string }) { | TBD | TBD | TBD |
| app\dashboard\settings\TelnyxKeyForm.tsx | 4 | L’accès Telnyx est administré centralement. Les comptes clients n’utilisent et ne reçoivent jamais l | TBD | TBD | TBD |
| app\dashboard\sms\page.tsx | 6 | // SERVER COMPONENT : Récupère les données de la base (ou de l'API Telnyx en async) AVANT de rendre  | TBD | TBD | TBD |
| app\dashboard\sms\SmsDashboardClient.tsx | 12 | telnyxMessageId: string; | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 12 | telnyxId: string; | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 117 | <p className="text-[var(--text-secondary)]">Gérez vos profils pour l'envoi et la réception de SMS/MM | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 204 | <p>Synchronisation avec Telnyx en cours...</p> | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 210 | <p className="max-w-md mx-auto mb-6">Vous n'avez pas encore créé de profil de messagerie sur Telnyx. | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 224 | <th className="px-6 py-4 font-semibold">ID Telnyx</th> | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 233 | <Link href={`/dashboard/sms/profiles/${profile.telnyxId}`} className="flex items-center gap-3 hover: | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 241 | {profile.telnyxId} | TBD | TBD | TBD |
| app\dashboard\sms\profiles\page.tsx | 247 | <Link href={`/dashboard/sms/profiles/${profile.telnyxId}`} className="p-2 inline-flex text-[var(--te | TBD | TBD | TBD |
| app\dashboard\sms\profiles\[id]\page.tsx | 13 | telnyxId: string; | TBD | TBD | TBD |
| app\dashboard\sms\profiles\[id]\page.tsx | 28 | const telnyxId = params.id as string; | TBD | TBD | TBD |
| app\dashboard\sms\profiles\[id]\page.tsx | 39 | const resProfile = await fetch(`/api/telecom/messaging-profiles/${telnyxId}`); | TBD | TBD | TBD |
| app\dashboard\sms\profiles\[id]\page.tsx | 60 | }, [telnyxId]); | TBD | TBD | TBD |
| app\dashboard\sms\profiles\[id]\page.tsx | 123 | <p className="text-[var(--text-secondary)] font-mono text-sm">ID: {profile.telnyxId}</p> | TBD | TBD | TBD |
| app\dashboard\softphone\page.tsx | 1 | import { SoftphoneWorkspace } from "@/components/softphone/SoftphoneWorkspace"; | TBD | TBD | TBD |
| app\dashboard\softphone\page.tsx | 6 | export default async function SoftphonePage() { | TBD | TBD | TBD |
| app\dashboard\softphone\page.tsx | 16 | title="Softphone" | TBD | TBD | TBD |
| app\dashboard\softphone\page.tsx | 22 | <SoftphoneWorkspace /> | TBD | TBD | TBD |
| app\dashboard\verify\page.tsx | 117 | <p className="text-sm text-[var(--text-secondary)] mb-4">Utilisez ce code d'exemple dans votre Backe | TBD | TBD | TBD |
| app\dashboard\verify\page.tsx | 121 | const response = await fetch('https://api.telnyx.com/v2/verifications', { | TBD | TBD | TBD |
| app\dashboard\verify\page.tsx | 125 | 'Authorization': 'Bearer VOTRE_CLE_API_TELNYX' | TBD | TBD | TBD |
| app\dashboard\video\page.tsx | 59 | Gérez vos salles de visioconférence WebRTC Telnyx. | TBD | TBD | TBD |
| app\dashboard\video\page.tsx | 78 | <th className="px-6 py-4 font-medium">ID Telnyx</th> | TBD | TBD | TBD |
| app\dashboard\video\room\[id]\page.tsx | 6 | import { initialize } from "@telnyx/video"; | TBD | TBD | TBD |
| app\dashboard\video\room\[id]\page.tsx | 7 | import type { Room } from "@telnyx/video"; | TBD | TBD | TBD |
| app\dashboard\video\room\[id]\page.tsx | 21 | // Telnyx Video state | TBD | TBD | TBD |
| app\dashboard\video\room\[id]\page.tsx | 61 | // 2. Initialize Telnyx Room | TBD | TBD | TBD |
| app\dashboard\video\room\[id]\page.tsx | 140 | console.error("Telnyx Room Error:", e); | TBD | TBD | TBD |
| app\dashboard\whatsapp\connect\ConnectClient.tsx | 12 | <div className="mb-8 text-center"><h1 className="text-3xl font-bold mb-2">Configuration WhatsApp Bus | TBD | TBD | TBD |
| app\dashboard\whatsapp\connect\ConnectClient.tsx | 16 | <div className="grid sm:grid-cols-2 gap-3 text-sm"><p>État Telnyx : <b>{existingAccount.status}</b>< | TBD | TBD | TBD |
| app\dashboard\whatsapp\connect\ConnectClient.tsx | 17 | {!ready && <div className="p-4 rounded-xl bg-amber-500/10 text-amber-600 flex gap-3"><AlertTriangle  | TBD | TBD | TBD |
| app\dashboard\whatsapp\connect\ConnectClient.tsx | 19 | </div> : <div className="text-center space-y-5"><AlertTriangle className="w-12 h-12 text-amber-500 m | TBD | TBD | TBD |
| app\dashboard\whatsapp\templates\TemplatesClient.tsx | 2 | /* eslint-disable @typescript-eslint/no-explicit-any -- Template components are stored JSON from Tel | TBD | TBD | TBD |
| app\dashboard\whatsapp\templates\TemplatesClient.tsx | 36 | toast.success('État du modèle synchronisé depuis Telnyx.'); | TBD | TBD | TBD |
| app\dashboard\whatsapp\templates\TemplatesClient.tsx | 43 | if (!window.confirm(`Supprimer définitivement le modèle « ${templateName} » chez Telnyx ?`)) return; | TBD | TBD | TBD |
| app\dashboard\whatsapp\templates\TemplatesClient.tsx | 49 | toast.success('Modèle supprimé chez Telnyx.'); | TBD | TBD | TBD |
| app\etudes-de-cas\page.tsx | 8 | "Exemples illustratifs d'organisations qui centralisent leurs appels, leurs numéros et leurs agents  | TBD | TBD | TBD |
| app\etudes-de-cas\page.tsx | 14 | solution: "Softphone & numéros", | TBD | TBD | TBD |
| app\etudes-de-cas\page.tsx | 17 | "Une chaîne d'agences attribue un numéro à chacun de ses conseillers. Les appels entrants et sortant | TBD | TBD | TBD |
| app\etudes-de-cas\page.tsx | 20 | "Softphone web, mobile et desktop sur le même compte", | TBD | TBD | TBD |
| app\etudes-de-cas\page.tsx | 38 | solution: "Softphone PWA", | TBD | TBD | TBD |
| app\god-mode\GodModeSidebar.tsx | 23 | { label: "Telnyx API Control", href: "/god-mode/telnyx" }, | TBD | TBD | TBD |
| app\god-mode\page.tsx | 13 | prisma.systemSettings.findUnique({ where: { id: "default" }, select: { telnyxApiKey: true } }), | TBD | TBD | TBD |
| app\god-mode\page.tsx | 27 | const telnyxReady = Boolean(systemSettings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API | TBD | TBD | TBD |
| app\god-mode\page.tsx | 56 | <span className="text-sm text-[var(--text-secondary)] mt-2">Provisioned via Telnyx</span> | TBD | TBD | TBD |
| app\god-mode\page.tsx | 90 | <div className={`w-10 h-10 rounded-full flex items-center justify-center ${telnyxReady ? 'bg-emerald | TBD | TBD | TBD |
| app\god-mode\page.tsx | 94 | <p className="font-medium">Telnyx SIP & API Gateway</p> | TBD | TBD | TBD |
| app\god-mode\page.tsx | 96 | {telnyxReady ? "API Keys present in environment" : "Missing API Keys in .env"} | TBD | TBD | TBD |
| app\god-mode\page.tsx | 100 | <span className={`px-3 py-1 text-xs font-medium rounded-full ${telnyxReady ? 'bg-emerald-500/10 text | TBD | TBD | TBD |
| app\god-mode\page.tsx | 101 | {telnyxReady ? 'Connected' : 'Pending Auth'} | TBD | TBD | TBD |
| app\god-mode\channels\ChannelsApprovalClient.tsx | 15 | // Here we would call a server action to update the DB and Telnyx API | TBD | TBD | TBD |
| app\god-mode\channels\ChannelsApprovalClient.tsx | 86 | <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">How Provisioning Works (Telnyx Hos | TBD | TBD | TBD |
| app\god-mode\channels\ChannelsApprovalClient.tsx | 88 | When you click <strong>Provision</strong>, your platform will call the Telnyx API to link the tenant | TBD | TBD | TBD |
| app\god-mode\compliance\ComplianceClient.tsx | 14 | if (!confirm("Are you sure you want to APPROVE this tenant? They will gain access to Telnyx purchasi | TBD | TBD | TBD |
| app\god-mode\compliance\ComplianceClient.tsx | 58 | <p className="text-[var(--text-secondary)]">Review and verify tenant identities to protect your Mast | TBD | TBD | TBD |
| app\god-mode\livekit\LiveKitConfigClient.tsx | 82 | This is the SIP URI where Telnyx will transfer incoming calls when an AI Agent is assigned to a numb | TBD | TBD | TBD |
| app\god-mode\livekit\LiveKitConfigClient.tsx | 105 | <CheckCircle className="w-4 h-4 text-emerald-500" /> Telnyx Webhook Ready | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 5 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 17 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 20 | const response = await telnyx.messagingProfiles.retrieve(profile.telnyxId); | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 28 | error: 'Profil inaccessible chez Telnyx. Vérifiez la clé et le compte associés.' }; | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 42 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 44 | await telnyx.messagingProfiles.update(profile.telnyxId, { | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 56 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 58 | const result = await telnyx.messagingProfiles.create({ | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 61 | if (!result.data?.id) throw new Error('Création Telnyx non confirmée.'); | TBD | TBD | TBD |
| app\god-mode\messaging\actions.ts | 62 | await prisma.messagingProfile.create({ data: { name: name.trim(), telnyxId: result.data.id, organiza | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 27 | <label className="block">Plafond quotidien Telnyx (USD)<input className="apple-input mt-1" type="num | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 36 | {saved && <p role="status" className="text-emerald-400">Configuration enregistrée chez Telnyx.</p>} | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 56 | catch { setError('Impossible de lire les données de messagerie. Vérifiez la connexion Telnyx et la b | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 61 | <p>Profils Telnyx et activité enregistrée dans l’application.</p> | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 62 | <button className="apple-btn" onClick={refresh}>Actualiser depuis Telnyx</button> | TBD | TBD | TBD |
| app\god-mode\messaging\page.tsx | 71 | <button className="apple-btn btn-primary" disabled={creating &#124;&#124; !organizationId &#124;&#12 | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 167 | const res = await fetch(`/api/admin/telnyx/numbers/search?${params.toString()}`); | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 190 | const res = await fetch(`/api/admin/telnyx/numbers/buy`, { | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 202 | : `La commande de ${phoneNumber} est acceptée par Telnyx ; l'activation est en cours.`); | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 219 | const res = await fetch("/api/admin/telnyx/numbers/sync", { method: "POST" }); | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 233 | const res = await fetch(`/api/admin/telnyx/numbers/assign`, { | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 259 | <p className="text-[var(--text-secondary)]">View allocated numbers and provision new ones via Telnyx | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 293 | Synchroniser depuis Telnyx | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 326 | <div className="text-[var(--text-secondary)] text-xs mt-1">Telnyx ID: {num.telnyxId &#124;&#124; "N/ | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 366 | {num.forwardToE164 &#124;&#124; "Softphone WebRTC"} | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 409 | <option value="APP">APP — softphone WebRTC</option> | TBD | TBD | TBD |
| app\god-mode\numbers\NumbersClient.tsx | 485 | Telnyx ne reçoit aucune destination choisie depuis le navigateur. Le backend valide le plan, le wall | TBD | TBD | TBD |
| app\god-mode\pricing\PricingSettingsClient.tsx | 55 | <p className="text-sm text-[var(--text-secondary)]">Marge appliquée lors de la revente des numéros T | TBD | TBD | TBD |
| app\god-mode\pricing\PricingSettingsClient.tsx | 73 | Ex: 2.5 signifie que vous vendez 2.5x le prix de Telnyx. Un numéro acheté 1$ sera vendu 2.50$. | TBD | TBD | TBD |
| app\god-mode\pricing\PricingSettingsClient.tsx | 99 | <p className="text-sm text-[var(--text-secondary)] mb-6">Le débit est appliqué côté serveur à chaque | TBD | TBD | TBD |
| app\god-mode\pricing\PricingSettingsClient.tsx | 107 | <label className="block text-sm mb-2">Coût Telnyx de base / minute ($)</label> | TBD | TBD | TBD |
| app\god-mode\pricing\PricingSettingsClient.tsx | 125 | <p className="text-xs text-[var(--text-secondary)] mt-2">Montant réellement débité du portefeuille a | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 7 | import { ensureTelnyxNumberCodeControlled, purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 8 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 9 | import { callControlApplicationPayload, credentialConnectionPayload, outboundVoiceProfilePayload } f | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 16 | // Keep the Telnyx console operational even while an unrelated pricing | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 18 | select: { id: true, telnyxApiKey: true, telnyxPublicKey: true, telnyxConnectionId: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 24 | select: { id: true, telnyxApiKey: true, telnyxPublicKey: true, telnyxConnectionId: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 30 | telnyxConnectionId: settings.telnyxConnectionId, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 31 | telnyxApiKeyConfigured: Boolean(settings.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KE | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 32 | telnyxPublicKeyConfigured: Boolean(settings.telnyxPublicKey?.trim() &#124;&#124; process.env.TELNYX_ | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 37 | export async function saveTelnyxApiKey(apiKey: string) { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 40 | if (!normalized) return { error: "La clé API Telnyx est obligatoire." }; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 43 | const validation = await fetch("https://api.telnyx.com/v2/balance", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 47 | if (!validation.ok) return { error: `Telnyx a refusé cette clé (HTTP ${validation.status}).` }; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 50 | update: { telnyxApiKey: normalized }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 51 | create: { id: "default", telnyxApiKey: normalized }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 54 | revalidatePath("/god-mode/telnyx"); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 58 | export async function saveTelnyxPublicKey(publicKey: string) { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 62 | return { error: "La clé publique Ed25519 Telnyx est invalide." }; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 66 | update: { telnyxPublicKey: normalized }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 67 | create: { id: "default", telnyxPublicKey: normalized }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 70 | revalidatePath("/god-mode/telnyx"); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 77 | select: { telnyxApiKey: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 79 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 80 | if (!apiKey) throw new Error("Clé API Telnyx non configurée dans God Mode."); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 85 | export async function saveTelnyxVoiceConnection(connectionId: string) { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 90 | update: { telnyxConnectionId: connectionId }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 91 | create: { id: "default", telnyxConnectionId: connectionId }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 94 | revalidatePath("/god-mode/telnyx"); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 98 | async function telnyxPatch(path: string, body: Record<string, unknown>) { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 100 | const response = await fetch(`https://api.telnyx.com/v2${path}`, { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 159 | t38_reinvite_source: "customer" &#124; "telnyx"; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 165 | const data = await telnyxPatch(`/credential_connections/${connectionId}`, credentialConnectionPayloa | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 195 | const data = await telnyxPatch(`/call_control_applications/${applicationId}`, callControlApplication | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 208 | where: { telnyxId: { not: { startsWith: "mock-" } } }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 209 | select: { id: true, telnyxId: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 211 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 216 | await ensureTelnyxNumberCodeControlled({ | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 217 | telnyx, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 218 | telnyxNumberId: number.telnyxId, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 220 | messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(), | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 230 | // 3. Fetch Balance from Telnyx API | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 231 | export async function fetchTelnyxBalance() { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 236 | const res = await fetch("https://api.telnyx.com/v2/balance", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 263 | const res = await fetch("https://api.telnyx.com/v2/outbound_voice_profiles", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 279 | const res = await fetch("https://api.telnyx.com/v2/outbound_voice_profiles", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 301 | const res = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${profileId}`, { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 322 | const res = await fetch("https://api.telnyx.com/v2/credential_connections", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 337 | const res = await fetch(`https://api.telnyx.com/v2/credential_connections/${connectionId}`, { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 363 | const res = await fetch("https://api.telnyx.com/v2/messaging_profiles", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 380 | const res = await fetch("https://api.telnyx.com/v2/call_control_applications", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 409 | const res = await fetch(`https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=${co | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 428 | const result = await purchaseTelnyxNumber({ | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 434 | revalidatePath("/god-mode/telnyx"); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 446 | const res = await fetch("https://api.telnyx.com/v2/messages?page[size]=15", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 460 | * the selected Telnyx connection and every active locally managed number. */ | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 468 | select: { telnyxConnectionId: true, telnyxPublicKey: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 471 | where: { status: "ACTIVE", telnyxId: { not: { startsWith: "mock-" } } }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 473 | id: true, number: true, telnyxId: true, incomingRoutingEnabled: true, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 479 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 480 | const publicKeyConfigured = Boolean(settings?.telnyxPublicKey?.trim() &#124;&#124; process.env.TELNY | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 484 | detail: publicKeyConfigured ? "Clé publique Ed25519 configurée." : "Ajoutez la clé publique Telnyx d | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 487 | checks.push({ key: "connection", label: "Connexion vocale", level: "BLOCKER", detail: "Aucune connex | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 491 | const connectionResponse = await fetch(`https://api.telnyx.com/v2/credential_connections/${connectio | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 495 | checks.push({ key: "connection", label: "Connexion vocale", level: "BLOCKER", detail: `Connexion int | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 499 | checks.push({ key: "connection", label: "Connexion vocale", level: connection.active !== false ? "PA | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 503 | checks.push({ key: "call-cost", label: "Coût dans les webhooks", level: connection.call_cost_in_webh | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 508 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 515 | telnyx.phoneNumbers.retrieve(number.telnyxId), | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 516 | telnyx.phoneNumbers.voice.retrieve(number.telnyxId), | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 523 | return { ...number, healthy: false, error: error?.message &#124;&#124; "Numéro inaccessible chez Tel | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 531 | detail: brokenNumbers.length ? `${brokenNumbers.length}/${numberResults.length} numéro(s) exigent un | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 534 | const deliveryResponse = await fetch("https://api.telnyx.com/v2/webhook_deliveries?page[size]=25", { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 565 | telnyxTelephonyCredentialId: true, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 566 | telnyxCredentialConnectionId: true, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 575 | credentialStatus: user.telnyxTelephonyCredentialId?.startsWith("provisioning:") | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 577 | : user.telnyxTelephonyCredentialId ? "ACTIVE" : "NOT_PROVISIONED", | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 586 | select: { telnyxTelephonyCredentialId: true }, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 590 | const credentialId = user.telnyxTelephonyCredentialId; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 594 | const response = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${credentialId}`, { | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 600 | return { error: `Telnyx n'a pas pu révoquer le credential : ${error.message}` }; | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 608 | telnyxTelephonyCredentialId: null, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 609 | telnyxCredentialConnectionId: null, | TBD | TBD | TBD |
| app\god-mode\telnyx\actions.ts | 612 | revalidatePath("/god-mode/telnyx"); | TBD | TBD | TBD |
| app\god-mode\telnyx\page.tsx | 2 | import { TelnyxHubClient } from "./TelnyxHubClient"; | TBD | TBD | TBD |
| app\god-mode\telnyx\page.tsx | 5 | title: "Telnyx Hub &#124; God Mode", | TBD | TBD | TBD |
| app\god-mode\telnyx\page.tsx | 8 | export default async function TelnyxControlPage() { | TBD | TBD | TBD |
| app\god-mode\telnyx\page.tsx | 11 | return <TelnyxHubClient initialSettings={settings} />; | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 6 | saveTelnyxApiKey, | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 7 | saveTelnyxPublicKey, | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 8 | fetchTelnyxBalance, | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 20 | saveTelnyxVoiceConnection, | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 29 | export function TelnyxHubClient({ initialSettings }: { initialSettings: any }) { | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 31 | const [apiKeyConfigured, setApiKeyConfigured] = useState(Boolean(initialSettings?.telnyxApiKeyConfig | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 33 | const [publicKeyConfigured, setPublicKeyConfigured] = useState(Boolean(initialSettings?.telnyxPublic | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 54 | const [voiceConnectionId, setVoiceConnectionId] = useState(initialSettings?.telnyxConnectionId &#124 | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 91 | const result = await saveTelnyxApiKey(newApiKey); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 95 | loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 102 | const result = await saveTelnyxPublicKey(newPublicKey); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 124 | const loadTelnyxData = async () => { | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 130 | fetchTelnyxBalance(), | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 203 | if (initialSettings?.telnyxApiKeyConfigured) { | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 204 | loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 270 | const connection = await saveTelnyxVoiceConnection(voiceConnectionId); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 325 | if (webhook.error) return setRoutingMessage(`Configuration enregistrée localement, mais Telnyx a ref | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 327 | await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 361 | await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 376 | await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 409 | await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 417 | <h1 className="text-3xl font-bold tracking-tight mb-2">Telnyx Mission Control</h1> | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 418 | <p className="text-[var(--text-secondary)]">Manage your master Telnyx account, view balance, and con | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 478 | <div className="font-bold">Telnyx API Error</div> | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 492 | This API key is used globally across the God Mode to manage Telnyx resources (fetch balances, buy nu | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 497 | <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">TELNYX_API_KEY (V2)</ | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 530 | placeholder={publicKeyConfigured ? "Configurée — saisir pour remplacer" : "Copiez la clé publique Te | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 564 | <p className="text-sm text-emerald-400/80">Your God Mode is securely connected to Telnyx.</p> | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 621 | <label className="block text-sm text-[var(--text-secondary)] mb-1">Tarif Telnyx maximal / min</label | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 654 | <button onClick={saveEditedProfile} disabled={isPending} className="mt-4 px-4 py-2 bg-cyan-600 hover | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 726 | await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 752 | <p className="text-sm text-[var(--text-secondary)] mt-1">Connexion utilisée par les numéros achetés, | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 824 | <label className="block text-xs text-[var(--text-secondary)]">Source réinvite T.38<select value={voi | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 893 | <button onClick={saveEditedCallApp} disabled={isPending} className="mt-4 px-4 py-2 bg-purple-600 hov | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 926 | if (!result.error) await loadTelnyxData(); | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 948 | <p className="text-sm text-[var(--text-secondary)] mt-1">Chaque utilisateur reçoit son propre creden | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 959 | <td className="px-5 py-4"><div>{user.credentialStatus}</div><div className="text-[10px] font-mono te | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 961 | {user.isCallable && user.telnyxTelephonyCredentialId && ( | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 962 | <button disabled={isPending} onClick={() => startTransition(async () => { const result = await setUs | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 964 | <button disabled={isPending} onClick={() => startTransition(async () => { const result = await setUs | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 1087 | <p className="text-sm text-[var(--text-secondary)] mt-1">Contrôle en direct la connexion, les webhoo | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 1094 | <p className="text-sm text-[var(--text-secondary)]">L’audit interroge Telnyx sans modifier la config | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 1115 | <span className="ml-3 text-[var(--text-secondary)]">{number.error &#124;&#124; (!number.connectionMa | TBD | TBD | TBD |
| app\god-mode\telnyx\TelnyxHubClient.tsx | 1123 | <h3 className="font-semibold mb-2">Dernières livraisons vocales Telnyx</h3> | TBD | TBD | TBD |
| app\god-mode\voice\page.tsx | 9 | const [webhookUrl, setWebhookUrl] = useState("https://api.antigravity.io/v1/telnyx/webhook"); | TBD | TBD | TBD |
| app\god-mode\voice\page.tsx | 19 | <p className="text-[var(--text-secondary)]">Contrôlez l'infrastructure vocale, le routage Telnyx et  | TBD | TBD | TBD |
| app\god-mode\voice\page.tsx | 65 | Paramètres de connexion avec l'API Telnyx Call Control. | TBD | TBD | TBD |
| app\god-mode\voice\page.tsx | 77 | <p className="text-xs text-[var(--text-secondary)] mt-2">URL appelée par Telnyx pour gérer les événe | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 2 | /* eslint-disable @typescript-eslint/no-explicit-any -- Telnyx SDK resources expose heterogeneous pa | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 6 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 18 | return e?.raw?.errors?.[0]?.detail &#124;&#124; e?.message &#124;&#124; 'Opération Telnyx non confir | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 23 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 25 | collect(telnyx.whatsapp.businessAccounts.list()), | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 26 | collect(telnyx.whatsapp.phoneNumbers.list()), | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 31 | telnyxId: true, | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 47 | telnyx.whatsapp.userData.retrieve().then((r: any) => r.data &#124;&#124; null).catch(() => null), | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 51 | try { return (await telnyx.whatsapp.businessAccounts.settings.retrieve(account.id)).data &#124;&#124 | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 58 | telnyx.whatsapp.phoneNumbers.profile.retrieve(number).then((r: any) => r.data &#124;&#124; null).cat | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 59 | telnyx.whatsapp.phoneNumbers.callingSettings.retrieve(number).then((r: any) => r.data &#124;&#124; n | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 60 | telnyx.whatsapp.phoneNumbers.profile.photo.retrieve(number).then((r: any) => r.data &#124;&#124; nul | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 77 | if (!input.organizationId &#124;&#124; !input.businessAccountId &#124;&#124; !phoneNumber) throw new | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 79 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 84 | telnyx.whatsapp.businessAccounts.retrieve(input.businessAccountId).then((r: any) => r.data), | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 85 | collect(telnyx.whatsapp.businessAccounts.phoneNumbers.list(input.businessAccountId)), | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 88 | if (!account?.id &#124;&#124; !account?.waba_id) throw new Error('Compte WhatsApp Telnyx introuvable | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 92 | await telnyx.whatsapp.businessAccounts.settings.update(account.id, { | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 100 | telnyxId: account.id, | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 114 | telnyxId: account.id, | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 138 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 141 | response = await telnyx.whatsapp.businessAccounts.settings.update(input.businessAccountId, { | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 151 | where: { telnyxId: input.businessAccountId }, | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 162 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 165 | response = await telnyx.whatsapp.phoneNumbers.profile.update(phoneNumber, { | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 187 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 188 | try { await telnyx.whatsapp.phoneNumbers.callingSettings.update(phoneNumber, { enabled }); } | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 197 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 199 | await telnyx.whatsapp.businessAccounts.phoneNumbers.initializeVerification(input.businessAccountId,  | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 212 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 213 | try { await telnyx.whatsapp.phoneNumbers.resendVerification(phoneNumber, { verification_method: meth | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 221 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 222 | try { await telnyx.whatsapp.phoneNumbers.verify(phoneNumber, { code: code.trim() }); } | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 236 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 238 | return (await telnyx.whatsapp.phoneNumbers.profile.photo.upload(phoneNumber, { file })).data &#124;& | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 246 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 247 | try { await telnyx.whatsapp.phoneNumbers.profile.photo.delete(phoneNumber); } | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 254 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| app\god-mode\whatsapp\actions.ts | 256 | return (await telnyx.whatsapp.userData.update({ | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 2 | /* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element -- Values are genera | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 17 | async function refresh() { try { setData(await loadWhatsAppControl()); setError(''); } catch (e) { s | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 27 | if (active) setError(e instanceof Error ? e.message : 'Lecture Telnyx impossible.'); | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 38 | <div><h1 className="text-3xl font-bold">WhatsApp Telnyx</h1><p>WABA, numéros, webhooks, profils, vér | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 39 | <button className="apple-btn" disabled={busy} onClick={refresh}>Synchroniser depuis Telnyx</button> | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 47 | <button className="apple-btn btn-primary" disabled={busy} onClick={() => run(() => configureWhatsApp | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 59 | <p className="text-sm">Déclenche chez Telnyx la vérification initiale Meta par SMS ou appel vocal.</ | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 62 | <button className="apple-btn btn-primary" disabled={busy &#124;&#124; !verification.businessAccountI | TBD | TBD | TBD |
| app\god-mode\whatsapp\page.tsx | 91 | <div className="flex flex-wrap items-center gap-3">{photoUrl && <img src={photoUrl} alt={`Profil Wha | TBD | TBD | TBD |
| app\ia\page.tsx | 38 | "Oui. Vous conservez votre numéro (portabilité gratuite) et vous basculez vers la softphone Antigrav | TBD | TBD | TBD |
| app\integrations\page.tsx | 14 | name: "Telnyx", | TBD | TBD | TBD |
| app\integrations\page.tsx | 25 | "Messagerie WhatsApp via l'API Telnyx : envoi, modèles de message, conversations et transfert vers u | TBD | TBD | TBD |
| app\onboarding\page.tsx | 20 | redirect("/dashboard/softphone"); | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 3 | import { telnyx } from "@/lib/telnyx"; | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 7 | import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 17 | // Fetch available numbers from Telnyx | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 18 | const response = await telnyx.availablePhoneNumbers.list({ | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 29 | return { error: "Failed to fetch numbers from Telnyx" }; | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 55 | // Single purchase path. Writing the row here directly stored the Telnyx | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 56 | // ORDER id in the unique `telnyxId` column, so the number could never be | TBD | TBD | TBD |
| app\onboarding\number\actions.ts | 58 | const result = await purchaseTelnyxNumber({ | TBD | TBD | TBD |
| app\onboarding\number\page.tsx | 47 | // Success, redirect to softphone | TBD | TBD | TBD |
| app\onboarding\number\page.tsx | 48 | router.push("/dashboard/softphone"); | TBD | TBD | TBD |
| app\pricing\page.tsx | 15 | "Abonnements mensuels pour la téléphonie professionnelle, le softphone cloud et les agents vocaux IA | TBD | TBD | TBD |
| app\pricing\page.tsx | 23 | "Abonnements mensuels sans engagement pour la téléphonie professionnelle, le softphone cloud et les  | TBD | TBD | TBD |
| app\register\page.tsx | 57 | Créez votre compte pour configurer vos numéros, votre softphone et vos agents vocaux. | TBD | TBD | TBD |
| app\secteurs\page.tsx | 145 | "Softphone dans le navigateur, sans installation", | TBD | TBD | TBD |
| app\terms\page.tsx | 44 | plateforme en ligne de téléphonie professionnelle, de softphone cloud et d&apos;agents | TBD | TBD | TBD |
| app\terms\page.tsx | 86 | Softphone web et application mobile utilisables dans un navigateur ou sur mobile, pour | TBD | TBD | TBD |
| components\crm\RecordView.tsx | 108 | <button className="text-[var(--brand)] hover:text-[var(--brand-active)] bg-[var(--bg-surface-hover)] | TBD | TBD | TBD |
| components\dashboard\Sidebar.tsx | 17 | console.log("Token reçu en frontend, prêt à être envoyé au backend Telnyx:", token); | TBD | TBD | TBD |
| components\dashboard\Sidebar.tsx | 74 | onClick={() => onNavigate('softphone')} | TBD | TBD | TBD |
| components\dashboard\Sidebar.tsx | 76 | currentView === 'softphone' | TBD | TBD | TBD |
| components\dashboard\Sidebar.tsx | 82 | Softphone App | TBD | TBD | TBD |
| components\landing\CaseStudies.tsx | 11 | description: "Chaque Collaborateur reçoit un numéro professionnel dédié. Les appels entrants et sort | TBD | TBD | TBD |
| components\landing\CaseStudies.tsx | 12 | products: ["Softphone Web", "Numéros Professionals", "Appels Internes"], | TBD | TBD | TBD |
| components\landing\CaseStudies.tsx | 26 | products: ["Softphone PWA", "Numéros Professionnels", "Transfert d'Appel"], | TBD | TBD | TBD |
| components\landing\CaseStudies.tsx | 39 | "Softphone Web": "text-cyan-500 border-cyan-500/30 bg-cyan-500/10", | TBD | TBD | TBD |
| components\landing\CaseStudies.tsx | 40 | "Softphone PWA": "text-cyan-500 border-cyan-500/30 bg-cyan-500/10", | TBD | TBD | TBD |
| components\landing\HeroSection.tsx | 52 | <WordReveal text="Le Softphone IA qui révolutionne votre" delay={0.1} /> | TBD | TBD | TBD |
| components\landing\HeroSection.tsx | 65 | Une plateforme pour centraliser vos appels, vos numéros professionnels et vos agents vocaux IA dans  | TBD | TBD | TBD |
| components\landing\HeroSection.tsx | 100 | <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 | TBD | TBD | TBD |
| components\landing\HeroSection.tsx | 136 | {/* Fake Softphone UI */} | TBD | TBD | TBD |
| components\landing\IndustrySolutions.tsx | 71 | description: "Softphone dans le navigateur, espace de travail installable et webhooks pour relier vo | TBD | TBD | TBD |
| components\landing\IndustrySolutions.tsx | 73 | "Softphone web, mobile et desktop", | TBD | TBD | TBD |
| components\landing\ProductTabs.tsx | 77 | "Téléphonie et WhatsApp via Telnyx", | TBD | TBD | TBD |
| components\landing\StatsBar.tsx | 9 | { value: "PWA", label: "Softphone web, mobile et desktop" }, | TBD | TBD | TBD |
| components\landing\ThoughtLeadership.tsx | 27 | title: "5 raisons de passer au softphone IA", | TBD | TBD | TBD |
| components\landing\TrustBar.tsx | 7 | "Softphone Web & Mobile (PWA)", | TBD | TBD | TBD |
| components\layout\MobileBottomNav.tsx | 5 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| components\layout\MobileBottomNav.tsx | 11 | { label: "Appels", icon: Phone, href: "/dashboard/softphone" }, | TBD | TBD | TBD |
| components\layout\MobileBottomNav.tsx | 18 | const { callState } = useTelnyx(); | TBD | TBD | TBD |
| components\layout\MobileBottomNav.tsx | 46 | document.documentElement.dataset.activeCallBar = String(activeCall && pathname !== "/dashboard/softp | TBD | TBD | TBD |
| components\layout\MobileBottomNav.tsx | 65 | {activeCall && pathname !== "/dashboard/softphone" && <Link href="/dashboard/softphone" className="a | TBD | TBD | TBD |
| components\marketing\IntegrationSearch.tsx | 56 | placeholder="Rechercher une intégration… (Telnyx, WhatsApp, Meta, Webhook…)" | TBD | TBD | TBD |
| components\marketing\MarketingFooter.tsx | 61 | Téléphonie professionnelle, softphone cloud et agents vocaux IA pour les entreprises. | TBD | TBD | TBD |
| components\pricing\PricingClient.tsx | 88 | derived.push("Softphone web et mobile (PWA)"); | TBD | TBD | TBD |
| components\providers\CommunicationProvider.tsx | 3 | import { TelnyxProvider } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| components\providers\CommunicationProvider.tsx | 4 | import { GlobalIncomingCall } from "@/components/softphone/GlobalIncomingCall"; | TBD | TBD | TBD |
| components\providers\CommunicationProvider.tsx | 5 | import { GlobalAppIncomingCall } from "@/components/softphone/GlobalAppIncomingCall"; | TBD | TBD | TBD |
| components\providers\CommunicationProvider.tsx | 9 | return <AppCallProvider><TelnyxProvider> | TBD | TBD | TBD |
| components\providers\CommunicationProvider.tsx | 13 | </TelnyxProvider></AppCallProvider>; | TBD | TBD | TBD |
| components\softphone\AppCallPanel.tsx | 15 | * Intégré au softphone, distinct du dialer PSTN (Telnyx). | TBD | TBD | TBD |
| components\softphone\GlobalIncomingCall.tsx | 3 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| components\softphone\GlobalIncomingCall.tsx | 7 | const { callState, callDirection, incomingCallerId, answerCall, rejectCall } = useTelnyx(); | TBD | TBD | TBD |
| components\softphone\Softphone.tsx | 4 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| components\softphone\Softphone.tsx | 24 | telnyxId: string; | TBD | TBD | TBD |
| components\softphone\Softphone.tsx | 27 | export function Softphone() { | TBD | TBD | TBD |
| components\softphone\Softphone.tsx | 40 | } = useTelnyx(); | TBD | TBD | TBD |
| components\softphone\Softphone.tsx | 157 | // The server resolves APP_TO_APP before Telnyx is used; | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 4 | import { Softphone } from "./Softphone"; | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 29 | export function SoftphoneWorkspace() { | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 69 | window.addEventListener('softphone:voicemail', refreshVoicemails); | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 70 | return () => window.removeEventListener('softphone:voicemail', refreshVoicemails); | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 272 | {/* Right Panel: Dialpad/Softphone */} | TBD | TBD | TBD |
| components\softphone\SoftphoneWorkspace.tsx | 276 | <Softphone /> | TBD | TBD | TBD |
| components\softphone\TelemetryStrip.tsx | 3 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| components\softphone\TelemetryStrip.tsx | 16 | const { callState, callDirection } = useTelnyx(); | TBD | TBD | TBD |
| components\whatsapp\EmbeddedSignupButton.tsx | 66 | console.log("Telnyx Link Success:", data); | TBD | TBD | TBD |
| components\whatsapp\EmbeddedSignupButton.tsx | 70 | console.error("Telnyx Link Error:", data); | TBD | TBD | TBD |
| contexts\AppCallContext.tsx | 46 | * AppCallContext — Appels APP_TO_APP (WebRTC natif P2P, hors Telnyx/PSTN). | TBD | TBD | TBD |
| contexts\LanguageContext.tsx | 25 | "dashboard.softphone": "Softphone", | TBD | TBD | TBD |
| contexts\LanguageContext.tsx | 53 | "dashboard.softphone": "Softphone", | TBD | TBD | TBD |
| contexts\LanguageContext.tsx | 81 | "dashboard.softphone": "الهاتف البرمجي", | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 5 | import { TelnyxRTC } from "@telnyx/webrtc"; | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 29 | interface TelnyxContextValue { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 48 | const TelnyxContext = createContext<TelnyxContextValue &#124; undefined>(undefined); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 69 | export const useTelnyx = () => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 70 | const context = useContext(TelnyxContext); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 72 | throw new Error("useTelnyx must be used within a TelnyxProvider"); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 83 | export const TelnyxProvider = ({ children }: { children: React.ReactNode }) => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 134 | artist: "Antigravity (Telnyx)", | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 146 | const el = document.getElementById("telnyx-remote-audio") as HTMLAudioElement &#124; null; | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 187 | *  (telnyxIDs/options) == callControlId du PSTN courant. */ | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 232 | await fetch("/api/telnyx/preauthorize/cancel", { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 257 | const initTelnyx = async () => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 272 | const response = await fetch("/api/telnyx/token"); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 289 | // Initialize Telnyx WebRTC Client (un seul client à la fois) | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 290 | const client = new TelnyxRTC({ | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 292 | remoteElement: "telnyx-remote-audio", // le SDK y rattache le remoteStream + play() | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 297 | client.on("telnyx.ready", () => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 300 | console.log("Telnyx WebRTC Ready"); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 303 | client.on("telnyx.error", (err: any) => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 308 | client.on("telnyx.notification", (notification: any) => { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 311 | console.log("[Telnyx Notification]", logMsg); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 359 | // attaché au <audio id="telnyx-remote-audio">). On ne DUPLIQUE PAS WebRTC. | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 368 | const el = document.getElementById("telnyx-remote-audio") as HTMLAudioElement &#124; null; | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 408 | // Connect to Telnyx WebRTC | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 411 | console.error("Failed to initialize Telnyx:", err); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 416 | initTelnyx(); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 418 | // Fallback poller to catch missed hangup/destroy states from Telnyx SDK | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 423 | console.log("[Telnyx Poller] Caught missed termination state:", state); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 447 | // l'UI d'appel entrant ; le média, lui, vient du SDK Telnyx (call.answer()). | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 464 | console.log("[TelnyxContext] Pusher channel subscribed:", appCallChannels.user(userId)); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 473 | console.warn(`[TelnyxContext] PSTN INCOMING ignoré — state=${callStateRef.current}`); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 511 | window.dispatchEvent(new CustomEvent("softphone:missed-call", { detail: data })); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 519 | window.dispatchEvent(new CustomEvent("softphone:voicemail", { detail: data })); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 527 | const res = await fetch("/api/telnyx/active-call"); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 577 | const authorizationResponse = await fetch("/api/telnyx/preauthorize", { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 602 | throw new Error("L'intégration Telnyx n'a pas pu créer l'appel."); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 637 | console.error("[TelnyxContext] SDK answer() failed:", err); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 642 | const res = await fetch("/api/telnyx/answer", { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 658 | console.error("[TelnyxContext] guard answer failed:", apiErr); | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 765 | // 2) Garde serveur : garantit que la leg Telnyx est clôturée (best effort). | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 768 | await fetch("/api/telnyx/hangup", { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 791 | // 2) Garde serveur : leg Telnyx (best effort, idempotent côté webhook/409). | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 794 | await fetch("/api/telnyx/hangup", { | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 824 | *  Le SDK a déjà attaché remoteStream au <audio id="telnyx-remote-audio">. */ | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 826 | const el = document.getElementById("telnyx-remote-audio") as HTMLAudioElement &#124; null; | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 835 | <TelnyxContext.Provider | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 855 | {/* Hidden audio element required for Telnyx to attach the remote stream */} | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 856 | <audio id="telnyx-remote-audio" autoPlay playsInline className="hidden" /> | TBD | TBD | TBD |
| contexts\TelnyxContext.tsx | 858 | </TelnyxContext.Provider> | TBD | TBD | TBD |
| hooks\useCallRouter.ts | 5 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| hooks\useCallRouter.ts | 21 | * Cela supprime le bypass où `makeCall()/newCall()` (Telnyx) serait appelé | TBD | TBD | TBD |
| hooks\useCallRouter.ts | 26 | const { makeCall } = useTelnyx(); | TBD | TBD | TBD |
| hooks\useCallRouter.ts | 88 | NOT_APP_TO_APP_DESTINATION: "Destination externe (Telnyx)", | TBD | TBD | TBD |
| hooks\useRingtone.ts | 2 | import { useTelnyx } from "@/contexts/TelnyxContext"; | TBD | TBD | TBD |
| hooks\useRingtone.ts | 6 | const { callState, callDirection } = useTelnyx(); | TBD | TBD | TBD |
| lib\account-context.ts | 56 | * independently (see /api/telnyx/preauthorize). | TBD | TBD | TBD |
| lib\account-context.ts | 61 | select: { id: true, number: true, telnyxId: true }, | TBD | TBD | TBD |
| lib\app-call-channels.ts | 29 | * Events Pusher pour les appels PSTN entrants (via Telnyx SIP). | TBD | TBD | TBD |
| lib\app-call-channels.ts | 31 | * Le webhook Telnyx publie `pstn:incoming` sur le canal privé de | TBD | TBD | TBD |
| lib\app-call-channels.ts | 32 | * l'utilisateur destinataire. Le client TelnyxContext s'y abonne et | TBD | TBD | TBD |
| lib\app-call-channels.ts | 33 | * affiche l'UI d'appel entrant, puis répond via l'API Telnyx. | TBD | TBD | TBD |
| lib\app-call-policy.ts | 9 | *    (qui restent gérés par Telnyx / wallet existants). | TBD | TBD | TBD |
| lib\billing.ts | 151 | * Réserve et débite réellement le prix d'un SMS avant de contacter Telnyx. | TBD | TBD | TBD |
| lib\billing.ts | 175 | description: 'Réservation pour envoi SMS Telnyx', | TBD | TBD | TBD |
| lib\billing.ts | 182 | export async function confirmSmsCharge(reference: string, telnyxMessageId: string) { | TBD | TBD | TBD |
| lib\billing.ts | 185 | data: { description: `Facturation SMS Telnyx ${telnyxMessageId}` }, | TBD | TBD | TBD |
| lib\billing.ts | 222 | * Réserve le prix God Mode d'un message WhatsApp avant tout appel Telnyx. | TBD | TBD | TBD |
| lib\billing.ts | 246 | description: 'Réservation pour envoi WhatsApp Telnyx', | TBD | TBD | TBD |
| lib\billing.ts | 253 | export async function confirmWhatsAppCharge(reference: string, telnyxMessageId: string) { | TBD | TBD | TBD |
| lib\billing.ts | 256 | data: { description: `Facturation WhatsApp Telnyx ${telnyxMessageId}` }, | TBD | TBD | TBD |
| lib\call-routing.ts | 13 | *    l'appel est bloqué explicitement — il ne bascule jamais vers Telnyx/PSTN. | TBD | TBD | TBD |
| lib\call-routing.ts | 62 | // Destination E.164 nettoyée qui part vers Telnyx. | TBD | TBD | TBD |
| lib\call-routing.ts | 121 | * Telnyx/PSTN. | TBD | TBD | TBD |
| lib\call-routing.ts | 166 | // ne jamais basculer l'appel vers Telnyx/PSTN. | TBD | TBD | TBD |
| lib\call-routing.ts | 193 | // Un utilisateur plateforme résolu ⇒ APP_TO_APP, JAMAIS Telnyx. | TBD | TBD | TBD |
| lib\call-routing.ts | 213 | * que le Dialpad/Telnyx acceptaient déjà. | TBD | TBD | TBD |
| lib\campaign-dialer-policy.ts | 83 | * 429, 5xx et l'erreur Telnyx `90103` (DPS) sont TRANSITOIRES → requeue. | TBD | TBD | TBD |
| lib\env-validation.ts | 10 | *  2. TELNYX        — cœur téléphonique du produit : sans Telnyx, aucun appel/SMS. | TBD | TBD | TBD |
| lib\env-validation.ts | 12 | *                     non-téléphoniques restent utilisables et les routes Telnyx | TBD | TBD | TBD |
| lib\env-validation.ts | 13 | *                     dégradent proprement (500 "Missing TELNYX_API_KEY", états | TBD | TBD | TBD |
| lib\env-validation.ts | 15 | *                     TELNYX_API_KEY, TELNYX_PUBLIC_KEY, TELNYX_SIP_CONNECTION_ID. | TBD | TBD | TBD |
| lib\env-validation.ts | 33 | const TELNYX: Tier = { | TBD | TBD | TBD |
| lib\env-validation.ts | 34 | label: "TELNYX", | TBD | TBD | TBD |
| lib\env-validation.ts | 35 | vars: ["TELNYX_API_KEY", "TELNYX_PUBLIC_KEY", "TELNYX_SIP_CONNECTION_ID"], | TBD | TBD | TBD |
| lib\env-validation.ts | 93 | // ── Palier 2 : TELNYX — cœur téléphonique ─────────────────────────────── | TBD | TBD | TBD |
| lib\env-validation.ts | 95 | // (encore) utiliser Telnyx, ou être en mode placeholder. Le softphone affiche | TBD | TBD | TBD |
| lib\env-validation.ts | 96 | // l'état de registration lui-même, et les routes /api/telnyx/* renvoient des | TBD | TBD | TBD |
| lib\env-validation.ts | 98 | const telnyxProblems = bad(TELNYX); | TBD | TBD | TBD |
| lib\env-validation.ts | 99 | if (telnyxProblems.length > 0) { | TBD | TBD | TBD |
| lib\env-validation.ts | 100 | const msg = `[ENV TELNYX] Intégration téléphonie cible : ${telnyxProblems.join(", ")}`; | TBD | TBD | TBD |
| lib\env-validation.ts | 103 | console.error("CRITICAL:", msg, "— appels/SMS Telnyx indisponibles, le reste fonctionne."); | TBD | TBD | TBD |
| lib\flow-engine.ts | 146 | // Envoi d'un message via l'infrastructure existante (Telnyx) | TBD | TBD | TBD |
| lib\pstn-billing.ts | 397 | // Telnyx is authoritative when it provides the finalized transport cost. | TBD | TBD | TBD |
| lib\pstn-billing.ts | 554 | /** Reconciles a call already settled from its fallback rate against Telnyx's | TBD | TBD | TBD |
| lib\pstn-billing.ts | 568 | prisma.callLog.findUnique({ where: { telnyxCallControlId: params.callControlId } }), | TBD | TBD | TBD |
| lib\pstn-billing.ts | 606 | description: `Réconciliation CDR Telnyx (${params.providerCurrency &#124;&#124; "devise inconnue"})` | TBD | TBD | TBD |
| lib\pstn-call-control.ts | 3 | * (`/api/telnyx/answer` et `/api/telnyx/hangup`). | TBD | TBD | TBD |
| lib\pstn-call-control.ts | 13 | *    hangup (409 Conflict), et Telnyx rejette lui-même un answer/hangup sur un | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 2 | * Corrélation pure Pusher (callControlId) ↔ SDK Telnyx (Call object). | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 4 | * Le SDK Telnyx v2.27.1 expose l'identifiant Call Control d'un appel sous | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 5 | * `call.telnyxIDs.telnyxCallControlId` (getter) et `call.options.telnyxCallControlId` | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 6 | * (valeurs liées au `telnyx_call_control_id` des messages invite/ringing/answer). | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 19 | /** ancien alias utilisé dans TelnyxContext (légacy) */ | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 23 | options?: { telnyxCallControlId?: string; [k: string]: unknown } &#124; null; | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 24 | telnyxIDs?: { telnyxCallControlId?: string; telnyxSessionId?: string; telnyxLegId?: string } &#124;  | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 30 | const fromIds = call.telnyxIDs?.telnyxCallControlId; | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 31 | const fromOptions = call.options?.telnyxCallControlId; | TBD | TBD | TBD |
| lib\pstn-correlation.ts | 80 | *                             (lève la sonnerie côté Telnyx). ACTIVE reste piloté par le SDK. | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 3 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 25 | callControlId: parent.telnyxCallControlId, | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 34 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 35 | await telnyx.calls.actions.hangup(parent.telnyxCallControlId, { command_id: crypto.randomUUID() }); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 115 | telnyxCallControlId: provisionalControlId, | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 144 | if (!child.telnyxCallControlId.startsWith("pending:")) { | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 146 | return { started: true, outboundCallControlId: child.telnyxCallControlId, recovered: true }; | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 148 | const outboundAttemptId = child.telnyxCallControlId.slice("pending:".length); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 163 | const settings = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { telnyx | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 164 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 165 | if (!connectionId) throw new Error("TELNYX_CONNECTION_NOT_CONFIGURED"); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 166 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 167 | await telnyx.calls.actions.answer(parent.telnyxCallControlId, { command_id: `${forwardCommandId}-ans | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 168 | const dial = await telnyx.calls.dial({ | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 172 | link_to: parent.telnyxCallControlId, | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 182 | await prisma.callLog.updateMany({ where: { id: child.id, telnyxCallControlId: provisionalControlId } | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 187 | await failForward(parent, child.id, "TELNYX_FORWARD_DIAL_FAILED"); | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 189 | return { started: false, reason: "TELNYX_FORWARD_DIAL_FAILED" }; | TBD | TBD | TBD |
| lib\pstn-forwarding.ts | 196 | // expires is safe and Telnyx deduplicates it. | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 2 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 40 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 41 | await telnyx.calls.actions.answer(call.telnyxCallControlId, { | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 46 | console.error(`[PSTN Voicemail] answer failed for ${call.telnyxCallControlId}`, error); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 51 | return { started: false, reason: "TELNYX_ANSWER_FAILED" }; | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 57 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 69 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 70 | await telnyx.calls.actions.speak(callControlId, { | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 80 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 81 | await telnyx.calls.actions.hangup(callControlId, { command_id: `${call.voicemailCommandId}-failure-h | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 87 | const call = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } }); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 97 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 98 | await telnyx.calls.actions.startRecording(callControlId, { | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 112 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\pstn-voicemail.ts | 113 | await telnyx.calls.actions.hangup(callControlId, { command_id: `${call.voicemailCommandId}-failure-h | TBD | TBD | TBD |
| lib\site-config.ts | 54 | "Softphone, appels, numéros, routage, agents IA, anomalie de fonctionnement, incident technique.", | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 4 | * Routage Telnyx — classification des `call.initiated` et construction | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 12 | export const TELNYX_TRANSFER_KIND = "AI_LIVEKIT_TRANSFER"; | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 13 | export const TELNYX_TRANSFER_VERSION = 1; | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 15 | export type TelnyxLegKind = | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 23 | export interface TelnyxCallInitiatedInput { | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 24 | /** direction exacte du payload Telnyx (`incoming` / `outgoing`). */ | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 58 | export function classifyTelnyxCallInitiated(input: TelnyxCallInitiatedInput): TelnyxLegKind { | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 81 | cs[TELNYX_TRANSFER_KIND_LOOKUP] === TELNYX_TRANSFER_KIND && | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 103 | const TELNYX_TRANSFER_KIND_LOOKUP = "kind"; | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 109 | * Ne contient aucun secret. Base64 (format requis par Telnyx). | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 111 | export function buildTelnyxTransferClientState(input: { | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 119 | kind: TELNYX_TRANSFER_KIND, | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 120 | v: TELNYX_TRANSFER_VERSION, | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 132 | * même (source, cible, but) → Telnyx ignore les doublons 60 s ; un replay | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 135 | export function buildTelnyxTransferCommandId(input: { | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 143 | throw new Error("buildTelnyxTransferCommandId: sourceCallControlId requis"); | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 152 | export function isTelnyxTransferChildLeg(call: { | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 165 | kind: TelnyxLegKind; | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 176 | * classés sont exclus (le coût Telnyx de la jambe B est de l'infra AI). | TBD | TBD | TBD |
| lib\telnyx-call-routing.ts | 178 | export function requiresPstnReservation(kind: TelnyxLegKind): boolean { | TBD | TBD | TBD |
| lib\telnyx-number-pricing.ts | 3 | export type TelnyxCostInformation = { | TBD | TBD | TBD |
| lib\telnyx-number-pricing.ts | 16 | * Price charged at acquisition. Telnyx is authoritative: if no price is | TBD | TBD | TBD |
| lib\telnyx-number-pricing.ts | 19 | export function telnyxAcquisitionCost(info: TelnyxCostInformation &#124; null &#124; undefined): num | TBD | TBD | TBD |
| lib\telnyx-number-pricing.ts | 27 | costInformation: TelnyxCostInformation &#124; null &#124; undefined; | TBD | TBD | TBD |
| lib\telnyx-number-pricing.ts | 31 | const providerCost = telnyxAcquisitionCost(params.costInformation); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 5 | import { resellerNumberPrice } from "@/lib/telnyx-number-pricing"; | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 6 | import { getConfiguredTelnyxClient } from "@/lib/telnyx"; | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 35 | description: "Remboursement d'une commande de numéro refusée par Telnyx", | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 43 | export async function findOwnedTelnyxNumber(telnyx: any, phoneNumber: string) { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 44 | const response = await telnyx.phoneNumbers.list({ | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 54 | * attached to our Call Control Application and native Telnyx forwarding is | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 56 | export async function ensureTelnyxNumberCodeControlled(params: { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 57 | telnyx: any; | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 58 | telnyxNumberId: string; | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 62 | await params.telnyx.phoneNumbers.update(params.telnyxNumberId, { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 65 | await params.telnyx.phoneNumbers.voice.update(params.telnyxNumberId, { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 72 | await params.telnyx.phoneNumbers.messaging.update(params.telnyxNumberId, { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 78 | function telnyxErrorStatus(error: unknown) { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 83 | /** Completes an asynchronously fulfilled order and activates its real Telnyx | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 85 | export async function activateFulfilledTelnyxOrder(telnyxOrderId: string): Promise<boolean> { | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 87 | prisma.numberOrder.findUnique({ where: { telnyxOrderId } }), | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 90 | select: { telnyxApiKey: true, telnyxConnectionId: true }, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 94 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 95 | if (!connectionId) throw new Error("TELNYX_CONFIGURATION_INCOMPLETE"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 96 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 110 | const owned = await findOwnedTelnyxNumber(telnyx, phoneNumber); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 112 | await ensureTelnyxNumberCodeControlled({ | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 113 | telnyx, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 114 | telnyxNumberId: owned.id, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 116 | messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(), | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 118 | console.error("[Telnyx Number Activation] Routing update failed", error); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 119 | throw new Error("TELNYX_NUMBER_ROUTING_FAILED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 129 | where: { telnyxId: owned.id }, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 141 | console.warn("[Telnyx Number Activation] Ownership conflict on late activation; persisted owner kept | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 142 | telnyxOrderId, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 152 | where: { telnyxId: owned.id }, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 159 | telnyxId: owned.id, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 170 | await prisma.numberOrder.update({ where: { telnyxOrderId }, data: { status: "success" } }); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 179 | * Funds are reserved atomically before contacting Telnyx. A deterministic | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 183 | export async function purchaseTelnyxNumber(options: PurchaseOptions): Promise<NumberPurchaseResult>  | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 199 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 200 | const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 201 | if (!connectionId) throw new Error("TELNYX_VOICE_CONNECTION_NOT_CONFIGURED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 202 | let telnyx: any; | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 204 | telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 206 | throw new Error("TELNYX_API_KEY_NOT_CONFIGURED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 213 | availability = await telnyx.availablePhoneNumbers.list({ | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 217 | console.error("[Telnyx Number Purchase] Availability SDK request failed", error); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 218 | throw new Error("TELNYX_NUMBER_AVAILABILITY_FAILED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 230 | if (chargedAmount === null) throw new Error("TELNYX_NUMBER_PRICE_UNAVAILABLE"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 249 | orderPayload = await telnyx.numberOrders.create({ | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 255 | const status = telnyxErrorStatus(error); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 258 | throw new Error("TELNYX_NUMBER_ORDER_REJECTED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 260 | console.error("[Telnyx Number Purchase] Ambiguous network result; funds remain reserved", { operatio | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 261 | throw new Error("TELNYX_ORDER_RESULT_UNKNOWN"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 266 | console.error("[Telnyx Number Purchase] Successful response without order id; funds remain reserved" | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 267 | throw new Error("TELNYX_ORDER_ID_MISSING"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 276 | where: { telnyxOrderId: orderId }, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 283 | telnyxOrderId: orderId, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 295 | description: `Achat du numéro ${phoneNumber} — commande Telnyx ${orderId}`, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 302 | const ownedNumber = await findOwnedTelnyxNumber(telnyx, phoneNumber); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 307 | await ensureTelnyxNumberCodeControlled({ | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 308 | telnyx, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 309 | telnyxNumberId: ownedNumber.id, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 313 | console.error("[Telnyx Number Purchase] Routing SDK update failed", error); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 314 | throw new Error("TELNYX_NUMBER_ROUTING_FAILED"); | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 319 | where: { telnyxId: ownedNumber.id }, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 330 | telnyxId: ownedNumber.id, | TBD | TBD | TBD |
| lib\telnyx-number-purchase.ts | 338 | await tx.numberOrder.update({ where: { telnyxOrderId: orderId }, data: { status: "success" } }); | TBD | TBD | TBD |
| lib\telnyx-voice-settings.ts | 32 | // Telnyx response examples also use "+E.164" while the accepted-value | TBD | TBD | TBD |
| lib\telnyx-voice-settings.ts | 125 | // Telnyx exposes two distinct properties: the E.164 number and the policy. | TBD | TBD | TBD |
| lib\telnyx-voice-settings.ts | 133 | t38_reinvite_source: enumValue(body.outbound.t38_reinvite_source, new Set(["customer", "telnyx"])), | TBD | TBD | TBD |
| lib\telnyx.ts | 1 | import Telnyx from 'telnyx'; | TBD | TBD | TBD |
| lib\telnyx.ts | 4 | let telnyxInstance: any = null; | TBD | TBD | TBD |
| lib\telnyx.ts | 5 | let configuredTelnyxInstance: any = null; | TBD | TBD | TBD |
| lib\telnyx.ts | 6 | let configuredTelnyxApiKey: string &#124; null = null; | TBD | TBD | TBD |
| lib\telnyx.ts | 9 | // Telnyx SDK >= 7 uses an options object. Passing the key positionally | TBD | TBD | TBD |
| lib\telnyx.ts | 11 | return new Telnyx({ apiKey }); | TBD | TBD | TBD |
| lib\telnyx.ts | 14 | export function getTelnyxClient() { | TBD | TBD | TBD |
| lib\telnyx.ts | 15 | if (!telnyxInstance) { | TBD | TBD | TBD |
| lib\telnyx.ts | 16 | const telnyxApiKey = process.env.TELNYX_API_KEY; | TBD | TBD | TBD |
| lib\telnyx.ts | 17 | if (!telnyxApiKey) { | TBD | TBD | TBD |
| lib\telnyx.ts | 18 | throw new Error('TELNYX_API_KEY is not defined in environment variables'); | TBD | TBD | TBD |
| lib\telnyx.ts | 20 | telnyxInstance = createClient(telnyxApiKey); | TBD | TBD | TBD |
| lib\telnyx.ts | 22 | return telnyxInstance; | TBD | TBD | TBD |
| lib\telnyx.ts | 26 | * Operational Telnyx client. God Mode is the source of truth; the environment | TBD | TBD | TBD |
| lib\telnyx.ts | 30 | export async function getConfiguredTelnyxApiKey() { | TBD | TBD | TBD |
| lib\telnyx.ts | 33 | select: { telnyxApiKey: true }, | TBD | TBD | TBD |
| lib\telnyx.ts | 35 | const apiKey = settings?.telnyxApiKey?.trim() &#124;&#124; process.env.TELNYX_API_KEY?.trim(); | TBD | TBD | TBD |
| lib\telnyx.ts | 36 | if (!apiKey) throw new Error('Telnyx API key is not configured'); | TBD | TBD | TBD |
| lib\telnyx.ts | 40 | /** Public Ed25519 key used to authenticate Telnyx webhooks. God Mode is the | TBD | TBD | TBD |
| lib\telnyx.ts | 41 | * source of truth and TELNYX_PUBLIC_KEY remains a deployment fallback. */ | TBD | TBD | TBD |
| lib\telnyx.ts | 42 | export async function getConfiguredTelnyxPublicKey() { | TBD | TBD | TBD |
| lib\telnyx.ts | 45 | select: { telnyxPublicKey: true }, | TBD | TBD | TBD |
| lib\telnyx.ts | 47 | const publicKey = settings?.telnyxPublicKey?.trim() &#124;&#124; process.env.TELNYX_PUBLIC_KEY?.trim | TBD | TBD | TBD |
| lib\telnyx.ts | 48 | if (!publicKey) throw new Error('Telnyx public key is not configured'); | TBD | TBD | TBD |
| lib\telnyx.ts | 52 | export async function getConfiguredTelnyxClient() { | TBD | TBD | TBD |
| lib\telnyx.ts | 53 | const apiKey = await getConfiguredTelnyxApiKey(); | TBD | TBD | TBD |
| lib\telnyx.ts | 54 | if (!configuredTelnyxInstance &#124;&#124; configuredTelnyxApiKey !== apiKey) { | TBD | TBD | TBD |
| lib\telnyx.ts | 55 | configuredTelnyxInstance = createClient(apiKey); | TBD | TBD | TBD |
| lib\telnyx.ts | 56 | configuredTelnyxApiKey = apiKey; | TBD | TBD | TBD |
| lib\telnyx.ts | 58 | return configuredTelnyxInstance; | TBD | TBD | TBD |
| lib\telnyx.ts | 63 | export async function getConfiguredTelnyxConnectionId() { | TBD | TBD | TBD |
| lib\telnyx.ts | 66 | select: { telnyxConnectionId: true }, | TBD | TBD | TBD |
| lib\telnyx.ts | 68 | return settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNECTION_ID?.trim( | TBD | TBD | TBD |
| lib\telnyx.ts | 72 | export const telnyx = new Proxy({} as any, { | TBD | TBD | TBD |
| lib\telnyx.ts | 74 | return getTelnyxClient()[prop]; | TBD | TBD | TBD |
| lib\whatsapp.ts | 5 | import { getConfiguredTelnyxClient } from '@/lib/telnyx'; | TBD | TBD | TBD |
| lib\whatsapp.ts | 47 | /** Validate the exact content object accepted by Telnyx messages.sendWhatsapp. */ | TBD | TBD | TBD |
| lib\whatsapp.ts | 117 | throw new WhatsAppSendError('Aucun compte WhatsApp Telnyx n’est attribué à cette organisation.', 422 | TBD | TBD | TBD |
| lib\whatsapp.ts | 120 | throw new WhatsAppSendError('Le numéro WhatsApp Telnyx n’est pas actif.', 422, 'WHATSAPP_NOT_ACTIVE' | TBD | TBD | TBD |
| lib\whatsapp.ts | 144 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| lib\whatsapp.ts | 147 | response = await telnyx.messages.sendWhatsapp({ | TBD | TBD | TBD |
| lib\whatsapp.ts | 160 | await refundWhatsAppCharge(input.organizationId, reservation.reference, `Refus Telnyx ${providerStat | TBD | TBD | TBD |
| lib\whatsapp.ts | 164 | ? 'Telnyx a refusé le message. Le montant a été remboursé.' | TBD | TBD | TBD |
| lib\whatsapp.ts | 167 | certainRejection ? 'TELNYX_REJECTED' : 'TELNYX_UNCERTAIN', | TBD | TBD | TBD |
| lib\whatsapp.ts | 172 | const telnyxMessageId = response?.data?.id; | TBD | TBD | TBD |
| lib\whatsapp.ts | 173 | if (!telnyxMessageId) { | TBD | TBD | TBD |
| lib\whatsapp.ts | 175 | 'Telnyx n’a pas confirmé l’envoi. Le débit reste réservé pour vérification.', | TBD | TBD | TBD |
| lib\whatsapp.ts | 177 | 'TELNYX_UNCERTAIN', | TBD | TBD | TBD |
| lib\whatsapp.ts | 181 | await confirmWhatsAppCharge(reservation.reference, telnyxMessageId); | TBD | TBD | TBD |
| lib\whatsapp.ts | 183 | where: { telnyxMessageId }, | TBD | TBD | TBD |
| lib\whatsapp.ts | 190 | telnyxMessageId, | TBD | TBD | TBD |
| public\manifest.json | 4 | "description": "Système de communication omnicanale pour entreprises B2B — softphone cloud, agents v | TBD | TBD | TBD |
| public\manifest.json | 56 | "name": "Softphone", | TBD | TBD | TBD |
| public\manifest.json | 58 | "description": "Ouvrir le softphone", | TBD | TBD | TBD |
| public\manifest.json | 59 | "url": "/dashboard/softphone", | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 2 | import { getConfiguredTelnyxClient } from "../lib/telnyx"; | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 3 | import { ensureTelnyxNumberCodeControlled } from "../lib/telnyx-number-purchase"; | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 8 | select: { telnyxConnectionId: true }, | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 10 | const connectionId = settings?.telnyxConnectionId?.trim() &#124;&#124; process.env.TELNYX_SIP_CONNEC | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 11 | if (!connectionId) throw new Error("TELNYX_CONNECTION_NOT_CONFIGURED"); | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 13 | const telnyx = await getConfiguredTelnyxClient(); | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 19 | const response = await telnyx.credentialConnections.retrieve(connectionId); | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 25 | const response = await telnyx.callControlApplications.retrieve(connectionId); | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 35 | where: { status: "ACTIVE", telnyxId: { not: { startsWith: "mock-" } } }, | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 36 | select: { id: true, number: true, telnyxId: true, incomingRoutingMode: true }, | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 42 | await ensureTelnyxNumberCodeControlled({ | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 43 | telnyx, | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 44 | telnyxNumberId: number.telnyxId, | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 46 | messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(), | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 50 | telnyx.phoneNumbers.retrieve(number.telnyxId), | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 51 | telnyx.phoneNumbers.voice.retrieve(number.telnyxId), | TBD | TBD | TBD |
| scripts\audit-telnyx-production.ts | 67 | operation: repair ? "REPAIRED_WITH_TELNYX_SDK" : "READ_ONLY_AUDIT", | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 2 | * Validation LIVE contrôlée du TELNYX CALL ROUTING (scénario inbound → AI → | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 6 | *   npx tsx scripts/live-test-telnyx-call-routing.ts preflight [--json] | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 7 | *   npx tsx scripts/live-test-telnyx-call-routing.ts start --number <e164> [--label <s>] | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 8 | *   npx tsx scripts/live-test-telnyx-call-routing.ts report [--mins <n>] | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 14 | *               TELNYX_ROUTING_LIVE_VALIDATION = PASS&#124;FAIL (+ premier événement). | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 16 | * Lecture SEULE de la base. Aucun appel Telnyx initié, aucun secret/Token loggé. | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 48 | const STATE_DIR = process.env.LIVE_TEST_STATE_DIR &#124;&#124; join(tmpdir(), "opencode", "telnyx-li | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 92 | console.log(`  telnyxApiKey      : ${settings?.telnyxApiKey ? "DÉFINIE (God Mode)" : "ABSENTE (env)" | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 93 | console.log(`  telnyxPublicKey   : ${settings?.telnyxPublicKey ? "DÉFINIE" : "ABSENTE"}`); | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 94 | console.log(`  telnyxConnectionId: ${settings?.telnyxConnectionId &#124;&#124; "(non défini — voir T | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 98 | console.log("[preflight] ⚠ les PLACEHOLDERS TELNYX_* locaux (sk-placeholder-e2e-not-used) sont ignor | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 156 | console.log("Ensuite : npx tsx scripts/live-test-telnyx-call-routing.ts report"); | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 202 | call_control_id: c.telnyxCallControlId, | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 227 | check("A &#124; jambe inbound classée PSTN_INBOUND", legA.direction === "INBOUND" && legA.callPurpos | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 241 | check("C &#124; child leg TRANSFER/AI_TRANSFER", legB.direction === "TRANSFER" && legB.callPurpose = | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 250 | check("D &#124; aucun UNMANAGED_CALLER_ID", unmanagedCaller.length === 0, unmanagedCaller.map((c) => | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 254 | check("E &#124; aucun UNMANAGED_DESTINATION incorrect", unmanagedDest.length === 0, unmanagedDest.ma | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 272 | const settleA = walletTx.filter((t) => t.type === TX_SETTLE && t.callControlId === legA.telnyxCallCo | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 278 | const settleB = walletTx.filter((t) => t.type === TX_SETTLE && legB && t.callControlId === legB.teln | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 284 | const holdA = walletTx.filter((t) => t.type === TX_HOLD && t.callControlId === legA.telnyxCallContro | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 285 | const settleA = walletTx.filter((t) => t.type === TX_SETTLE && t.callControlId === legA.telnyxCallCo | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 286 | const refundA = walletTx.filter((t) => t.type === TX_REFUND && t.callControlId === legA.telnyxCallCo | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 342 | console.log(`Provider cost (Telnyx réel si capturé) : ${legA.providerCost ?? "non renseigné (dépend  | TBD | TBD | TBD |
| scripts\live-test-telnyx-call-routing.ts | 359 | console.log(`TELNYX_ROUTING_LIVE_VALIDATION = ${verdict}`); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 205 | const preauthorize = read("app/api/telnyx/preauthorize/route.ts"); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 217 | ok("updateNumber never rewrites organizationId, number, status or telnyxId", !/organizationId&#124;s | TBD | TBD | TBD |
| scripts\test-account-context.ts | 225 | const purchaseSrc = read("lib/telnyx-number-purchase.ts"); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 227 | const activation = fnBody(purchaseSrc, /export async function activateFulfilledTelnyxOrder/); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 247 | const syncSrc = read("app/api/admin/telnyx/numbers/sync/route.ts"); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 253 | ok("the number-order handler still calls the guarded activation helper", /activateFulfilledTelnyxOrd | TBD | TBD | TBD |
| scripts\test-account-context.ts | 263 | const assignSrc = read("app/api/admin/telnyx/numbers/assign/route.ts"); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 303 | const softphone = read("components/softphone/Softphone.tsx"); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 304 | ok("the softphone re-reads its caller IDs without a page reload", /refreshNumbers/.test(softphone) & | TBD | TBD | TBD |
| scripts\test-account-context.ts | 305 | ok("the softphone keeps a still-valid selection instead of snapping back to the first entry", /data\ | TBD | TBD | TBD |
| scripts\test-account-context.ts | 315 | ok(`${file}: delegates to purchaseTelnyxNumber`, /purchaseTelnyxNumber\(/.test(src)); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 316 | ok(`${file}: never fabricates a telnyxId`, !/pending_/.test(src)); | TBD | TBD | TBD |
| scripts\test-account-context.ts | 321 | const adminBuy = code(read("app/api/admin/telnyx/numbers/buy/route.ts")); | TBD | TBD | TBD |
| scripts\test-admin-guard.ts | 117 | const sync = readFileSync(join(adminDir, "telnyx", "numbers", "sync", "route.ts"), "utf8"); | TBD | TBD | TBD |
| scripts\test-admin-guard.ts | 124 | const assign = readFileSync(join(adminDir, "telnyx", "numbers", "assign", "route.ts"), "utf8"); | TBD | TBD | TBD |
| scripts\test-call-routing.ts | 5 | * Aucun accès DB, Telnyx, wallet ou Pusher n'est effectué ici. | TBD | TBD | TBD |
| scripts\test-cron-guard.ts | 119 | // Corps sans les lignes d'import (les imports mentionnent prisma/telnyx). | TBD | TBD | TBD |
| scripts\test-dashboard-modules.ts | 11 | assert.equal(resolveDashboardModule('/dashboard/softphone'), 'voice'); | TBD | TBD | TBD |
| scripts\test-dialpad.tsx | 13 | import { Dialpad } from "../components/softphone/Dialpad"; | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 33 | telnyxId: string; | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 41 | /** Mirrors `prisma.phoneNumber.upsert({ where: { telnyxId } })` post-fix. */ | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 42 | function activate(db: Db, telnyxId: string, patch: Partial<Row>, order: { organizationId: string; re | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 43 | const existing = db.get(telnyxId) ?? null; | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 47 | db.set(telnyxId, { ...existing, ...patch }); | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 49 | db.set(telnyxId, { id: `row-${telnyxId}`, telnyxId, status: "PENDING", ...patch, ...ownership } as R | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 53 | /** Mirrors `prisma.phoneNumber.upsert` in `purchaseTelnyxNumber` post-fix. */ | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 54 | function purchase(db: Db, telnyxId: string, patch: Partial<Row>, buyer: string, organizationId: stri | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 55 | const existing = db.get(telnyxId) ?? null; | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 57 | db.set(telnyxId, { ...existing, ...patch }); | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 59 | db.set(telnyxId, { | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 60 | id: `row-${telnyxId}`, | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 61 | telnyxId, | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 71 | function godModeAssign(db: Db, telnyxId: string, organizationId: string, memberIds: string[], reques | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 72 | const current = db.get(telnyxId); | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 78 | db.set(telnyxId, { ...current, organizationId, assignedUserId: assignee }); | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 134 | // Alice voit N3 (softphone caller-ID authority = DB relation). | TBD | TBD | TBD |
| scripts\test-number-assignment.ts | 223 | db.set("tel-legacy", { id: "r", number: "+15559999", telnyxId: "tel-legacy", organizationId: ORG_A.i | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 5 | *  1. Numéro Telnyx → résout l'org et l'utilisateur | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 144 | check("1. numéro Telnyx → résout l'org et l'utilisateur", | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 459 | telnyxCallControlId: cc ?? undefined, | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 461 | telnyxIDs: { | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 462 | telnyxCallControlId: cc ?? "", | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 463 | telnyxSessionId: "sess", | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 464 | telnyxLegId: "leg", | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 621 | // Test 38 — extraction Call Control ID (getter telnyxIDs + options) | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 624 | const viaOptions = getCallControlId({ id: "v_11", options: { telnyxCallControlId: "DEF" } } as any); | TBD | TBD | TBD |
| scripts\test-pstn-incoming.ts | 626 | check("38. getCallControlId lit telnyxIDs/options ; null si absent", | TBD | TBD | TBD |
| scripts\test-pstn-ledger.ts | 90 | telnyxCallControlId: controlId, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 2 | * Tests du hardening TELNYX CALL ROUTING — module GROUPE PUR (aucune DB, aucun | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 3 | * env, aucun appel Telnyx réel). Exécution : npx tsx scripts/test-telnyx-call-routing.ts | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 21 | classifyTelnyxCallInitiated, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 22 | buildTelnyxTransferCommandId, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 23 | buildTelnyxTransferClientState, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 24 | isTelnyxTransferChildLeg, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 27 | TELNYX_TRANSFER_KIND, | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 28 | } from "../lib/telnyx-call-routing"; | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 49 | const transferKind = TELNYX_TRANSFER_KIND; | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 53 | const kind = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 62 | const unmanaged = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 74 | const validChild = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 113 | check("D5 &#124; isTelnyxTransferChildLeg(direction=TRANSFER) → true", | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 114 | isTelnyxTransferChildLeg({ direction: "TRANSFER", callPurpose: "AI_TRANSFER" }) === true); | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 115 | check("D6 &#124; isTelnyxTransferChildLeg(PSTN_INBOUND) → false", | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 116 | isTelnyxTransferChildLeg({ direction: "INBOUND", callPurpose: "PSTN_INBOUND" }) === false); | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 121 | const a = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-1", target: "sip:LiveKit", purpo | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 122 | const b = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-1", target: "sip:LiveKit", purpo | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 123 | check("E1 &#124; command_id de transfert DÉTERMINISTE (retry Telnyx = même commande)", a === b, `${a | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 128 | check("E3 &#124; transfer utilise buildTelnyxTransferCommandId", | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 129 | webhook.includes("buildTelnyxTransferCommandId")); | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 133 | webhook.includes("P2002") && webhook.includes("TELNYX_TRANSFER_CHILD_CREATED")); | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 140 | const kind = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 149 | const weird = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 161 | const wrongConn = classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 170 | classifyTelnyxCallInitiated({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 181 | const replay1 = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:t", purpo | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 182 | const replay2 = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:t", purpo | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 183 | const newIntention = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:othe | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 187 | const src = buildTelnyxTransferClientState({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 194 | const tgt = buildTelnyxTransferClientState({ | TBD | TBD | TBD |
| scripts\test-telnyx-call-routing.ts | 204 | decoded.kind === TELNYX_TRANSFER_KIND && decoded.sourceCallControlId === "ccic-A", | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 2 | import { resellerNumberPrice, telnyxAcquisitionCost } from '../lib/telnyx-number-pricing'; | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 4 | assert.equal(telnyxAcquisitionCost({ upfront_cost: '3.21', monthly_cost: '6.54' }), 3.21); | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 5 | assert.equal(telnyxAcquisitionCost({ upfront_cost: '0', monthly_cost: '6.54' }), 6.54); | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 6 | assert.equal(telnyxAcquisitionCost({}), null); | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 7 | assert.equal(telnyxAcquisitionCost({ upfront_cost: 'not-a-price' }), null); | TBD | TBD | TBD |
| scripts\test-telnyx-number-pricing.ts | 25 | console.log('PASS  tarification réelle des numéros Telnyx (7 contrôles)'); | TBD | TBD | TBD |
| scripts\test-telnyx-voice-settings.ts | 6 | } from "../lib/telnyx-voice-settings"; | TBD | TBD | TBD |
| scripts\test-telnyx-voice-settings.ts | 70 | console.log("PASS  Telnyx Voice settings are validated and production-safe"); | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 18 | assert.match(sender, /messages\.sendWhatsapp\(/, 'WhatsApp must use the Telnyx SDK sender.'); | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 20 | assert.match(sender, /confirmWhatsAppCharge\(/, 'A confirmed Telnyx ID must confirm billing.'); | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 26 | assert.match(webhook, /message\.sent/, 'Telnyx sent events must be handled.'); | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 27 | assert.match(webhook, /message\.finalized/, 'Telnyx finalized events must be handled.'); | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 28 | assert.match(webhook, /getConfiguredTelnyxApiKey\(\)/, 'Protected media must use the God Mode Telnyx | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 29 | assert.doesNotMatch(webhook, /Bearer \$\{process\.env\.TELNYX_API_KEY\}/, 'WhatsApp must not bypass  | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 36 | assert.match(templateCollection, /whatsapp\.templates\.create/, 'Templates must be created with the  | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 37 | assert.match(templateResource, /whatsappMessageTemplates\.retrieve/, 'Templates must be retrievable  | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 38 | assert.match(templateResource, /whatsappMessageTemplates\.update/, 'Templates must be editable throu | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 39 | assert.match(templateResource, /whatsappMessageTemplates\.delete/, 'Templates must be deleted throug | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 43 | assert.match(schema, /model WhatsAppAccount[\s\S]*telnyxId\s+String\?\s+@unique/, 'The Telnyx WABA m | TBD | TBD | TBD |
| scripts\test-whatsapp-production.ts | 44 | assert.match(schema, /model WhatsAppTemplate[\s\S]*telnyxId\s+String\?\s+@unique/, 'The Telnyx templ | TBD | TBD | TBD |
| scripts\e2e\app-call-e2e.ts | 113 | // Bob navigates on the fully-client Softphone page to avoid the /dashboard Server-Component render  | TBD | TBD | TBD |
| scripts\e2e\app-call-e2e.ts | 114 | await bob.page.goto("/dashboard/softphone"); | TBD | TBD | TBD |
| scripts\e2e\app-call-e2e.ts | 159 | await alice.page.goto("/dashboard/softphone"); | TBD | TBD | TBD |
| scripts\e2e\app-call-e2e.ts | 169 | result("softphone-renders", /Appel interne \(App-to-App\)/.test(panelText ?? ""), "/dashboard/softph | TBD | TBD | TBD |
| server\media-server.ts | 43 | // WebSocket server for Telnyx media | TBD | TBD | TBD |
| server\media-server.ts | 48 | wss.on('connection', (telnyxWs, req) => { | TBD | TBD | TBD |
| server\media-server.ts | 49 | console.log(`[☎️ Telnyx connected] ${req.url}`); | TBD | TBD | TBD |
| server\media-server.ts | 60 | // Disable Nagle's algorithm for incoming Telnyx WS to reduce latency | TBD | TBD | TBD |
| server\media-server.ts | 61 | if ((telnyxWs as any)._socket) { | TBD | TBD | TBD |
| server\media-server.ts | 62 | (telnyxWs as any)._socket.setNoDelay(true); | TBD | TBD | TBD |
| server\media-server.ts | 81 | // We will initialize the session when we receive the Telnyx 'start' event with the AI Agent context | TBD | TBD | TBD |
| server\media-server.ts | 94 | // OpenAI sends base64 audio. We send it to Telnyx. | TBD | TBD | TBD |
| server\media-server.ts | 95 | if (streamId && telnyxWs.readyState === WebSocket.OPEN) { | TBD | TBD | TBD |
| server\media-server.ts | 96 | telnyxWs.send(JSON.stringify({ | TBD | TBD | TBD |
| server\media-server.ts | 195 | // Clear Telnyx media buffer to stop AI from speaking immediately | TBD | TBD | TBD |
| server\media-server.ts | 196 | if (streamId && telnyxWs.readyState === WebSocket.OPEN) { | TBD | TBD | TBD |
| server\media-server.ts | 197 | telnyxWs.send(JSON.stringify({ | TBD | TBD | TBD |
| server\media-server.ts | 201 | console.log(`[Telnyx] Sent clear_media for stream ${streamId}`); | TBD | TBD | TBD |
| server\media-server.ts | 222 | // Handle incoming messages from Telnyx | TBD | TBD | TBD |
| server\media-server.ts | 223 | telnyxWs.on('message', (message) => { | TBD | TBD | TBD |
| server\media-server.ts | 228 | console.log(`[Telnyx] Stream started: ${streamId}`); | TBD | TBD | TBD |
| server\media-server.ts | 245 | console.error("[Telnyx] Failed to parse custom_parameters", e); | TBD | TBD | TBD |
| server\media-server.ts | 252 | (telnyxWs as any).callStartTimeMs = callStartTimeMs; | TBD | TBD | TBD |
| server\media-server.ts | 253 | (telnyxWs as any).organizationId = organizationId; | TBD | TBD | TBD |
| server\media-server.ts | 412 | console.log(`[Telnyx] Stream stopped`); | TBD | TBD | TBD |
| server\media-server.ts | 424 | const startMs = (telnyxWs as any).callStartTimeMs; | TBD | TBD | TBD |
| server\media-server.ts | 425 | const orgId = (telnyxWs as any).organizationId; | TBD | TBD | TBD |
| server\media-server.ts | 488 | where: { telnyxCallControlId: callControlId }, | TBD | TBD | TBD |
| server\media-server.ts | 530 | telnyxWs.on('close', async () => { | TBD | TBD | TBD |
| server\media-server.ts | 531 | logger.info('[☎️ Telnyx disconnected]'); | TBD | TBD | TBD |
| docs\github-actions-cron.md | 12 | `https://application-softphone-xi.vercel.app` ; | TBD | TBD | TBD |
| docs\github-actions-cron.md | 27 | &#124; Toutes les 15 min &#124; `billing-sync` &#124; Réconciliation des coûts CDR Telnyx &#124; | TBD | TBD | TBD |
| docs\github-actions-cron.md | 33 | facturation initiale restent pilotés par les webhooks Telnyx : ils ne dépendent | TBD | TBD | TBD |
| docs\github-actions-cron.md | 45 | Il utilise `DATABASE_URL`, les paramètres Telnyx de production et, si défini, | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 1 | # Routage PSTN Telnyx piloté par God Mode | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 6 | du routage entrant. Le forwarding natif du numéro chez Telnyx reste désactivé. | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 7 | Telnyx transporte les appels et exécute les commandes envoyées par le backend ; | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 10 | ## Correspondance God Mode / Telnyx | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 12 | &#124; God Mode &#124; Donnée locale &#124; Action Telnyx &#124; | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 14 | &#124; Connexion SIP/WebRTC &#124; `SystemSettings.telnyxConnectionId` &#124; Connexion du numéro et | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 16 | &#124; Profil vocal sortant &#124; `PricingPlan` et configuration Telnyx &#124; Autorise les destina | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 24 | - `APP` : Telnyx reçoit le PSTN, envoie le webhook signé, le backend notifie | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 41 | - Caller ID sortant limité au numéro Telnyx détenu par l'organisation. | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 45 | 1. Dans `/god-mode/telnyx`, configurer la connexion active, les webhooks et le | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 54 | `CallLog`, `CallReservation` et les webhooks Telnyx. | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 56 | ## Documentation Telnyx | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 58 | - Dial : https://developers.telnyx.com/api-reference/call-commands/dial | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 59 | - Bridge : https://developers.telnyx.com/api-reference/call-commands/bridge-calls | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 60 | - Commandes Voice : https://developers.telnyx.com/docs/voice/programmable-voice/sending-commands | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 61 | - WebRTC Credential Connections : https://developers.telnyx.com/docs/voice/webrtc/auth/credential-co | TBD | TBD | TBD |
| docs\telnyx-pstn-routing.md | 62 | - Routage WebRTC / Call Control : https://developers.telnyx.com/docs/voice/webrtc/use-cases/outbound | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 1 | # Téléphonie Telnyx en production | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 4 | Telnyx n'est pas la source de vérité fonctionnelle : God Mode enregistre les | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 5 | secrets opérationnels, applique les paramètres via l'API Telnyx et contrôle que | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 11 | Client WebRTC ── jeton court backend ── Telnyx WebRTC | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 16 | Numéro Telnyx ── connexion sélectionnée ────────┤ | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 23 | Le SDK WebRTC communique nécessairement avec l'infrastructure média Telnyx, | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 27 | effectués côté serveur avec le SDK ou l'API Telnyx. | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 31 | La page `/god-mode/telnyx` gère réellement : | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 58 | 2. Le transfert natif du numéro Telnyx est désactivé. Le code décide seul du | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 60 | 3. Telnyx envoie `call.initiated` au webhook HTTPS v2. | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 69 | Telnyx peut livrer les webhooks en double, simultanément ou dans le désordre. | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 88 | Dans **God Mode → Telnyx → API Logs & Debug**, lancer **Audit téléphonique de | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 89 | production**. L'audit interroge Telnyx en lecture seule et signale comme | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 99 | - transfert natif Telnyx encore actif ; | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 105 | réapplique la connexion sélectionnée et désactive le transfert natif Telnyx. | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 109 | Les migrations `20260910000000_add_telnyx_public_key` et | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 113 | `TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY` et `TELNYX_SIP_CONNECTION_ID` restent des | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 132 | message d'accueil, joue le bip Telnyx et enregistre uniquement la piste de | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 137 | moment de l'écoute, le backend authentifié demande à Telnyx une URL de | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 142 | - [Fondamentaux Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-fun | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 143 | - [Réception des webhooks](https://developers.telnyx.com/docs/voice/programmable-voice/receiving-web | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 144 | - [Webhooks Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-webhook | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 145 | - [Commandes Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/sending-commands | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 146 | - [Démarrer un enregistrement](https://developers.telnyx.com/api-reference/call-commands/recording-s | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 147 | - [Récupérer un enregistrement](https://developers.telnyx.com/api-reference/call-recordings/retrieve | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 148 | - [Événement de fin de synthèse vocale](https://developers.telnyx.com/api-reference/callbacks/call-s | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 149 | - [Reprises de commandes](https://developers.telnyx.com/docs/voice/programmable-voice/command-retrie | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 150 | - [Connexion par credentials](https://developers.telnyx.com/api-reference/credential-connections/cre | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 151 | - [Profils vocaux sortants](https://developers.telnyx.com/api-reference/outbound-voice-profiles/crea | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 152 | - [Livraisons de webhooks](https://developers.telnyx.com/api-reference/webhooks/list-webhook-deliver | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 153 | - [Authentification WebRTC](https://developers.telnyx.com/docs/voice/webrtc/auth/credential-connecti | TBD | TBD | TBD |
| docs\telnyx-voice-production.md | 154 | - [Notifications push WebRTC](https://developers.telnyx.com/docs/voice/webrtc/push-notifications?lan | TBD | TBD | TBD |
| docs\TURN_PRODUCTION.md | 4 | **APP_TO_APP** (WebRTC P2P natif, hors Telnyx/PSTN), via **Cloudflare Realtime | TBD | TBD | TBD |
| prisma\seed.ts | 44 | telnyxId: 'telnyx_id_1', | TBD | TBD | TBD |
| prisma\seed.ts | 55 | telnyxId: 'telnyx_id_2', | TBD | TBD | TBD |
| prisma\seed.ts | 66 | telnyxCallControlId: 'call_1', | TBD | TBD | TBD |
| prisma\seed.ts | 80 | telnyxCallControlId: 'call_2', | TBD | TBD | TBD |
| prisma\seed.ts | 93 | telnyxCallControlId: 'call_3', | TBD | TBD | TBD |
| prisma\seed.ts | 116 | telnyxMessageId: 'msg_1', | TBD | TBD | TBD |
| prisma\seed.ts | 131 | telnyxMessageId: 'msg_2', | TBD | TBD | TBD |
| prisma\seed.ts | 146 | telnyxMessageId: 'msg_3', | TBD | TBD | TBD |
| prisma\seed.ts | 148 | body: 'Promo: Get 20% off all softphone plans this weekend!', | TBD | TBD | TBD |
| prisma\seedInbox.ts | 24 | telnyxId: "mock_telnyx_id_for_seed", | TBD | TBD | TBD |
| prisma\seedInbox.ts | 34 | telnyxMessageId: `msg_${Date.now()}_1`, | TBD | TBD | TBD |
| prisma\seedInbox.ts | 44 | telnyxMessageId: `msg_${Date.now()}_2`, | TBD | TBD | TBD |
| prisma\seedInbox.ts | 54 | telnyxMessageId: `msg_${Date.now()}_3`, | TBD | TBD | TBD |
| prisma\seedInbox.ts | 69 | telnyxCallControlId: `call_${Date.now()}_1`, | TBD | TBD | TBD |
| prisma\seedInbox.ts | 86 | telnyxCallControlId: `call_${Date.now()}_2`, | TBD | TBD | TBD |
| prisma\seedInbox.ts | 103 | telnyxCallControlId: `call_${Date.now()}_3`, | TBD | TBD | TBD |
