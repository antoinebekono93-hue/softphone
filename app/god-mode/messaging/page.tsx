"use client";

import { useEffect, useState } from 'react';
import { loadMessaging, saveMessagingProfile, createMessagingProfile } from './actions';

function ProfileEditor({ profile, refresh }: { profile: any; refresh: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: profile.name || '', enabled: Boolean(profile.enabled), smart_encoding: Boolean(profile.smart_encoding),
    daily_spend_limit: profile.daily_spend_limit || '10', daily_spend_limit_enabled: Boolean(profile.daily_spend_limit_enabled),
    destinations: (profile.whitelisted_destinations || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save() {
    setSaving(true); setError(''); setSaved(false);
    try { await saveMessagingProfile(profile.id, form); setSaved(true); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Échec de sauvegarde'); }
    finally { setSaving(false); }
  }
  return <section className="glass-panel p-5 space-y-4">
    <h2 className="text-xl font-semibold">{profile.name}</h2>
    <p>{profile.organization} · {profile.numbers} numéro(s) associé(s)</p>
    {profile.error ? <p role="alert">{profile.error}</p> : <>
      <label className="block">Nom<input className="apple-input mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label className="block">Pays autorisés<input className="apple-input mt-1" value={form.destinations} onChange={e => setForm({ ...form, destinations: e.target.value })} /></label>
      <label className="block">Plafond quotidien Telnyx (USD)<input className="apple-input mt-1" type="number" min="0.0001" step="0.0001" value={form.daily_spend_limit} onChange={e => setForm({ ...form, daily_spend_limit: e.target.value })} /></label>
      <div className="flex flex-wrap gap-4">
        <label><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Profil actif</label>
        <label><input type="checkbox" checked={form.smart_encoding} onChange={e => setForm({ ...form, smart_encoding: e.target.checked })} /> Encodage optimisé</label>
        <label><input type="checkbox" checked={form.daily_spend_limit_enabled} onChange={e => setForm({ ...form, daily_spend_limit_enabled: e.target.checked })} /> Appliquer le plafond</label>
      </div>
      <p className="text-sm break-all">Webhook actuel : {profile.webhook_url || 'Absent'}</p>
      <p className="text-sm">La sauvegarde raccorde les événements SMS au webhook de production de l’application.</p>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {saved && <p role="status" className="text-emerald-400">Configuration enregistrée chez Telnyx.</p>}
      <button disabled={saving} onClick={save} className="apple-btn btn-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
    </>}
  </section>;
}

export default function GodModeMessagingPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadMessaging>> | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [creating, setCreating] = useState(false);
  async function create() {
    setCreating(true); setError('');
    try { await createMessagingProfile(organizationId, name); setName(''); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Création non confirmée.'); }
    finally { setCreating(false); }
  }
  async function refresh() {
    try { setData(await loadMessaging()); setError(''); }
    catch { setError('Impossible de lire les données de messagerie. Vérifiez la connexion Telnyx et la base de données.'); }
  }
  useEffect(() => { void refresh(); }, []);
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold">Messagerie SMS/MMS</h1>
    <p>Profils Telnyx et activité enregistrée dans l’application.</p>
    <button className="apple-btn" onClick={refresh}>Actualiser depuis Telnyx</button>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {!data && !error && <p>Chargement…</p>}
    {data && <>
      <section className="glass-panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">Créer un profil</h2>
        <label className="block">Organisation<select className="apple-input" value={organizationId} onChange={e => setOrganizationId(e.target.value)}><option value="">Choisir…</option>{data.organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label className="block">Nom<input className="apple-input" value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label>
        <p className="text-sm">Le profil est créé désactivé. Configurez les pays et activez-le ci-dessous avant l’envoi.</p>
        <button className="apple-btn btn-primary" disabled={creating || !organizationId || !name.trim()} onClick={create}>{creating ? 'Création…' : 'Créer chez Telnyx'}</button>
      </section>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-panel p-5">Messages sortants enregistrés : {data.sent}</div>
        <div className="glass-panel p-5">Livraisons confirmées : {data.delivered}</div>
        <div className="glass-panel p-5">Échecs confirmés : {data.failed}</div>
      </div>
      {!data.profiles.length && <p>Aucun profil associé à une organisation. Créez un profil depuis la section SMS du compte client.</p>}
      <div className="grid lg:grid-cols-2 gap-4">{data.profiles.map(p => <ProfileEditor key={p.id + JSON.stringify(p)} profile={p} refresh={refresh} />)}</div>
    </>}
  </div>;
}
