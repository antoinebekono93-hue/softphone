"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element -- Values are generated Telnyx resource unions and the image URL is a Meta CDN response. */

import { useEffect, useState } from 'react';
import { assignWhatsAppAccount, configureWhatsAppSignupWebhook, deleteWhatsAppProfilePhoto, initializeWhatsAppVerification, loadWhatsAppControl, saveWabaSettings, saveWhatsAppProfile, setWhatsAppCalling, resendWhatsAppVerification, uploadWhatsAppProfilePhoto, verifyWhatsAppNumber } from './actions';

type Data = Awaited<ReturnType<typeof loadWhatsAppControl>>;

export default function GodModeWhatsAppPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignment, setAssignment] = useState({ organizationId: '', businessAccountId: '', phoneNumber: '', messagingProfileId: '' });
  const [signupFailover, setSignupFailover] = useState<string | null>(null);
  const [verification, setVerification] = useState({ businessAccountId: '', phoneNumber: '', displayName: '', language: 'fr', method: 'sms' as 'sms' | 'voice' });
  async function refresh() { try { setData(await loadWhatsAppControl()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Lecture Telnyx impossible.'); } }
  useEffect(() => {
    let active = true;
    void loadWhatsAppControl()
      .then(result => {
        if (!active) return;
        setData(result);
        setError('');
      })
      .catch(e => {
        if (active) setError(e instanceof Error ? e.message : 'Lecture Telnyx impossible.');
      });
    return () => { active = false; };
  }, []);
  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setError(''); setSuccess('');
    try { await action(); setSuccess(done); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Opération non confirmée.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6 pb-16">
    <div><h1 className="text-3xl font-bold">WhatsApp Telnyx</h1><p>WABA, numéros, webhooks, profils, vérification et appels pilotés par le SDK.</p></div>
    <button className="apple-btn" disabled={busy} onClick={refresh}>Synchroniser depuis Telnyx</button>
    {error && <p role="alert" className="text-red-400">{error}</p>}{success && <p role="status" className="text-emerald-400">{success}</p>}
    {!data && !error && <p>Chargement…</p>}
    {data && <>
      <section className="glass-panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">Webhooks de production</h2>
        <p className="text-sm break-all">Messages : {data.productionWebhook}</p><p className="text-sm break-all">Inscription : {data.userData?.webhook_url || 'Non configurée'}</p>
        <input className="apple-input" value={signupFailover ?? data.userData?.webhook_failover_url ?? ''} onChange={e => setSignupFailover(e.target.value)} placeholder="Webhook HTTPS de secours" />
        <button className="apple-btn btn-primary" disabled={busy} onClick={() => run(() => configureWhatsAppSignupWebhook(signupFailover ?? data.userData?.webhook_failover_url ?? ''), 'Webhook d’inscription enregistré.')}>Enregistrer chez Telnyx</button>
      </section>
      <section className="glass-panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">Attribuer un compte réel</h2>
        <select className="apple-input" value={assignment.organizationId} onChange={e => setAssignment({ ...assignment, organizationId: e.target.value })}><option value="">Organisation…</option>{data.organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select className="apple-input" value={assignment.businessAccountId} onChange={e => setAssignment({ ...assignment, businessAccountId: e.target.value, phoneNumber: '' })}><option value="">Compte WABA…</option>{data.businessAccounts.map(a => <option key={a.id} value={a.id}>{a.name || a.waba_id} — {a.status}</option>)}</select>
        <select className="apple-input" value={assignment.phoneNumber} onChange={e => setAssignment({ ...assignment, phoneNumber: e.target.value })}><option value="">Numéro WhatsApp…</option>{data.phoneNumbers.filter(p => !assignment.businessAccountId || data.businessAccounts.find(a => a.id === assignment.businessAccountId)?.waba_id === p.waba_id).map(p => <option key={p.phone_number_id || p.phone_number} value={p.phone_number}>{p.phone_number} — {p.status}</option>)}</select>
        <input className="apple-input" value={assignment.messagingProfileId} onChange={e => setAssignment({ ...assignment, messagingProfileId: e.target.value })} placeholder="Messaging Profile ID (facultatif)" />
        <button className="apple-btn btn-primary" disabled={busy || !assignment.organizationId || !assignment.businessAccountId || !assignment.phoneNumber} onClick={() => run(() => assignWhatsAppAccount(assignment), 'Compte attribué et webhook activé.')}>Attribuer</button>
      </section>
      <section className="glass-panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">Enregistrer et vérifier un numéro</h2>
        <p className="text-sm">Déclenche chez Telnyx la vérification initiale Meta par SMS ou appel vocal.</p>
        <select className="apple-input" value={verification.businessAccountId} onChange={e => setVerification({ ...verification, businessAccountId: e.target.value })}><option value="">Compte WABA…</option>{data.businessAccounts.map(a => <option key={a.id} value={a.id}>{a.name || a.waba_id}</option>)}</select>
        <div className="grid md:grid-cols-2 gap-3"><input className="apple-input" value={verification.phoneNumber} onChange={e => setVerification({ ...verification, phoneNumber: e.target.value })} placeholder="Numéro E.164" /><input className="apple-input" value={verification.displayName} onChange={e => setVerification({ ...verification, displayName: e.target.value })} placeholder="Nom d’affichage Meta" /><input className="apple-input" value={verification.language} onChange={e => setVerification({ ...verification, language: e.target.value })} placeholder="Langue (fr)" /><select className="apple-input" value={verification.method} onChange={e => setVerification({ ...verification, method: e.target.value as 'sms' | 'voice' })}><option value="sms">SMS</option><option value="voice">Appel vocal</option></select></div>
        <button className="apple-btn btn-primary" disabled={busy || !verification.businessAccountId || !verification.phoneNumber || !verification.displayName} onClick={() => run(() => initializeWhatsAppVerification(verification), 'Vérification initialisée chez Telnyx.')}>Lancer la vérification</button>
      </section>
      <div className="grid lg:grid-cols-2 gap-5">{data.businessAccounts.map(account => <WabaCard key={account.id} account={account} busy={busy} run={run} />)}</div>
      <div className="space-y-5">{data.phoneNumbers.map(phone => <PhoneCard key={phone.phone_number_id || phone.phone_number} phone={phone} busy={busy} run={run} />)}</div>
      <section className="glass-panel p-5"><h2 className="text-xl font-semibold mb-3">Attributions locales</h2>{data.mappings.map(m => <p key={m.id}>{m.organization.name} · {m.phoneNumber} · {m.status} · {m.enabled ? 'actif' : 'inactif'} · qualité {m.qualityRating || '—'}</p>)}</section>
    </>}
  </div>;
}

function WabaCard({ account, busy, run }: { account: any; busy: boolean; run: (a: () => Promise<unknown>, d: string) => Promise<void> }) {
  const s = account.settings || {};
  const [form, setForm] = useState({ name: s.name || account.name || '', timezone: s.timezone || 'UTC', webhookEnabled: s.webhook_enabled !== false, webhookEvents: (s.webhook_events || []).join(', '), failoverUrl: s.webhook_failover_url || '' });
  return <section className="glass-panel p-5 space-y-3"><h2 className="text-xl font-semibold">{account.name || account.waba_id}</h2><p className="text-sm">État {account.status} · revue {account.account_review_status || '—'} · entreprise {account.business_verification_status || '—'}</p>
    <input className="apple-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom" /><input className="apple-input" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} placeholder="Fuseau IANA" /><input className="apple-input" value={form.webhookEvents} onChange={e => setForm({ ...form, webhookEvents: e.target.value })} placeholder="Événements séparés par virgule" /><input className="apple-input" value={form.failoverUrl} onChange={e => setForm({ ...form, failoverUrl: e.target.value })} placeholder="Webhook de secours" />
    <label><input type="checkbox" checked={form.webhookEnabled} onChange={e => setForm({ ...form, webhookEnabled: e.target.checked })} /> Événements activés</label><button className="apple-btn btn-primary" disabled={busy} onClick={() => run(() => saveWabaSettings({ businessAccountId: account.id, ...form }), 'Réglages WABA enregistrés.')}>Enregistrer</button></section>;
}

function PhoneCard({ phone, busy, run }: { phone: any; busy: boolean; run: (a: () => Promise<unknown>, d: string) => Promise<void> }) {
  const p = phone.profile || {};
  const [form, setForm] = useState({ about: p.about || '', address: p.address || '', category: p.category || '', description: p.description || '', displayName: p.display_name || phone.display_name || '', email: p.email || '', website: p.website || '', messagingProfileId: p.profile_id || '' });
  const [code, setCode] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const photoUrl = phone.photo?.profile_photo_url;
  const uploadPhoto = () => {
    const formData = new FormData();
    if (photo) formData.set('file', photo);
    return uploadWhatsAppProfilePhoto(phone.phone_number, formData);
  };
  return <section className="glass-panel p-5 space-y-3"><h2 className="text-xl font-semibold">{phone.phone_number}</h2><p className="text-sm">{phone.status} · qualité {phone.quality_rating || '—'} · envoi {phone.enabled ? 'actif' : 'inactif'} · appels {phone.calling?.enabled ? 'actifs' : 'inactifs'}</p>
    <div className="flex flex-wrap items-center gap-3">{photoUrl && <img src={photoUrl} alt={`Profil WhatsApp ${phone.phone_number}`} className="h-16 w-16 rounded-full object-cover" />}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhoto(e.target.files?.[0] || null)} /><button className="apple-btn" disabled={busy || !photo} onClick={() => run(uploadPhoto, 'Photo envoyée chez Telnyx.')}>Envoyer la photo</button>{photoUrl && <button className="apple-btn" disabled={busy} onClick={() => { if (window.confirm('Supprimer la photo WhatsApp de ce numéro ?')) void run(() => deleteWhatsAppProfilePhoto(phone.phone_number), 'Photo supprimée.'); }}>Supprimer la photo</button>}</div>
    <div className="grid md:grid-cols-2 gap-3">{(['displayName','category','about','address','email','website','messagingProfileId'] as const).map(key => <input key={key} className="apple-input" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={key} />)}</div><textarea className="apple-input min-h-24" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
    <div className="flex flex-wrap gap-2"><button className="apple-btn btn-primary" disabled={busy} onClick={() => run(() => saveWhatsAppProfile(phone.phone_number, form), 'Profil enregistré.')}>Enregistrer le profil</button><button className="apple-btn" disabled={busy} onClick={() => run(() => setWhatsAppCalling(phone.phone_number, !phone.calling?.enabled), 'Réglage des appels enregistré.')}>{phone.calling?.enabled ? 'Désactiver' : 'Activer'} les appels</button><button className="apple-btn" disabled={busy} onClick={() => run(() => resendWhatsAppVerification(phone.phone_number, 'sms'), 'Code SMS renvoyé.')}>Renvoyer le code</button></div>
    <div className="flex gap-2"><input className="apple-input" value={code} onChange={e => setCode(e.target.value)} placeholder="Code de vérification" /><button className="apple-btn btn-primary" disabled={busy || !code} onClick={() => run(() => verifyWhatsAppNumber(phone.phone_number, code), 'Numéro vérifié.')}>Valider</button></div>
  </section>;
}
