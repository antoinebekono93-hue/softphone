'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ConnectClient({ existingAccount }: { phoneNumbers: any[]; existingAccount: any }) {
  const router = useRouter();
  const ready = existingAccount?.enabled && existingAccount?.webhookEnabled;
  return <div className="max-w-3xl mx-auto py-12 px-4">
    <div className="mb-8 text-center"><h1 className="text-3xl font-bold mb-2">Configuration WhatsApp Business</h1><p className="text-[var(--text-secondary)]">État synchronisé avec les ressources WhatsApp réelles du compte Telnyx.</p></div>
    <Card className="p-8">
      {existingAccount ? <div className="space-y-6">
        <div className="text-center"><div className={`w-20 h-20 ${ready ? 'bg-emerald-500/10' : 'bg-amber-500/10'} rounded-full flex items-center justify-center mx-auto mb-6`}>{ready ? <ShieldCheck className="w-10 h-10 text-emerald-500" /> : <AlertTriangle className="w-10 h-10 text-amber-500" />}</div><h2 className="text-2xl font-bold">{ready ? 'WhatsApp est opérationnel' : 'Activation en attente'}</h2><p className="text-[var(--text-secondary)] mt-2">{existingAccount.phoneNumber}</p></div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm"><p>État Telnyx : <b>{existingAccount.status}</b></p><p>Numéro activé : <b>{existingAccount.enabled ? 'Oui' : 'Non'}</b></p><p>Webhook : <b>{existingAccount.webhookEnabled ? 'Actif' : 'Inactif'}</b></p><p>Qualité : <b>{existingAccount.qualityRating || 'Non disponible'}</b></p><p>Appels WhatsApp : <b>{existingAccount.callingEnabled ? 'Actifs' : 'Inactifs'}</b></p><p>Vérification : <b>{existingAccount.businessVerificationStatus || 'Non disponible'}</b></p></div>
        {!ready && <div className="p-4 rounded-xl bg-amber-500/10 text-amber-600 flex gap-3"><AlertTriangle className="shrink-0" /><p>Le compte existe mais Telnyx ne le signale pas encore comme actif avec le webhook de production. Un administrateur doit terminer la vérification dans God Mode.</p></div>}
        <div className="flex justify-center gap-3"><Button onClick={() => router.push('/dashboard/whatsapp/templates')} disabled={!ready}><CheckCircle2 className="w-4 h-4 mr-2" />Gérer les modèles</Button><Button variant="outline" onClick={() => router.refresh()}><Settings className="w-4 h-4 mr-2" />Actualiser</Button></div>
      </div> : <div className="text-center space-y-5"><AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" /><h2 className="text-2xl font-bold">Aucun compte WhatsApp Telnyx attribué</h2><p className="text-[var(--text-secondary)]">L’ancien raccordement simulé a été supprimé. Pour éviter les faux comptes et les jetons Meta stockés en clair, un administrateur doit sélectionner un WABA et un numéro réellement présents chez Telnyx depuis God Mode → WhatsApp.</p><p className="text-sm">Après attribution et vérification, cette page affichera automatiquement l’état réel du numéro.</p></div>}
    </Card>
  </div>;
}
