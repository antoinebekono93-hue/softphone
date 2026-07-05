'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, CheckCircle2, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';

export default function ConnectClient({ phoneNumbers, existingAccount }: { phoneNumbers: any[], existingAccount: any }) {
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');

  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '123456789012345'; // Configured in .env
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || 'CONFIG_ID';

  useEffect(() => {
    if (existingAccount) return;

    // Load Facebook SDK only if no existing account
    if (document.getElementById('facebook-jssdk')) {
      setIsSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId: appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v19.0'
        });
        setIsSdkLoaded(true);
      };
    };

    document.body.appendChild(script);
  }, [appId, existingAccount]);

  const handleConnect = () => {
    if (!selectedPhoneId) {
      setError("Veuillez sélectionner un numéro de téléphone d'abord.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Bypass Meta SDK for testing if using mock App ID
    if (appId === '123456789012345') {
      simulateConnection();
      return;
    }

    if (!isSdkLoaded || !(window as any).FB) {
      setError('Facebook SDK is not loaded yet. Please wait or check your adblocker.');
      setIsLoading(false);
      return;
    }

    (window as any).FB.login(
      async (response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          await executeConnection(code);
        } else {
          setError('Authentification Meta annulée par l\'utilisateur.');
          setIsLoading(false);
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureV2: '', sessionInfoVersion: '3' }
      }
    );
  };

  const simulateConnection = async () => {
    setTimeout(async () => {
      await executeConnection("mock_token_" + Date.now());
    }, 1500); // simulate network delay
  };

  const executeConnection = async (code: string) => {
    try {
      // Meta Graph API / Telnyx Tech Provider flow
      const waba_id = "MOCK_WABA_" + Math.floor(Math.random() * 1000000);
      
      const res = await fetch('/api/whatsapp/tech-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waba_id,
          phoneNumberId: selectedPhoneId,
          accessToken: code || "mock_token"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de la connexion WhatsApp');
      }

      alert('Numéro WhatsApp Business connecté avec succès !');
      router.refresh(); // Refresh to show connected state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Voulez-vous vraiment déconnecter ce compte WhatsApp ? Vos campagnes et séquences seront interrompues.")) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would also notify Telnyx to delete the WABA association
      const res = await fetch('/api/whatsapp/tech-provider', { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur lors de la déconnexion");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Configuration WhatsApp Business</h1>
        <p className="text-[var(--text-secondary)]">
          Liez votre numéro Antigravité à l'API officielle WhatsApp pour envoyer des campagnes et créer des bots.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-[var(--border-subtle)]">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {existingAccount ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">WhatsApp est Connecté !</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Votre compte WhatsApp Business est actif sur le numéro <span className="font-mono bg-[var(--bg-surface)] px-2 py-1 rounded">{existingAccount.phoneNumber}</span>.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => router.push('/dashboard/whatsapp/templates')}
                className="btn-primary-gradient px-6 py-3"
              >
                Gérer les Modèles
              </button>
              <button 
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                {isLoading ? "Déconnexion..." : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Déconnecter
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">1. Choisissez un numéro Antigravité</label>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Ce numéro sera converti en numéro WhatsApp Business. Il ne pourra plus être utilisé sur une application WhatsApp personnelle.</p>
              
              {phoneNumbers.length === 0 ? (
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <p className="text-[var(--text-secondary)] mb-4">Vous n'avez aucun numéro de téléphone disponible.</p>
                  <button onClick={() => router.push('/dashboard/numbers')} className="btn-primary-gradient px-4 py-2 text-sm">
                    Acheter un Numéro
                  </button>
                </div>
              ) : (
                <select 
                  value={selectedPhoneId} 
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Sélectionnez un numéro...</option>
                  {phoneNumbers.map(phone => (
                    <option key={phone.id} value={phone.id}>
                      {phone.number} {phone.friendlyName ? `(${phone.friendlyName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-8 opacity-70">
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">2. Authentification Facebook (Meta)</label>
              <p className="text-sm text-[var(--text-secondary)]">Vous serez redirigé vers Facebook pour valider votre entreprise. Assurez-vous d'avoir les droits administrateur sur le Business Manager.</p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!isSdkLoaded || isLoading || !selectedPhoneId}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white transition-all
                ${(!isSdkLoaded || isLoading || !selectedPhoneId) ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#1DA851] shadow-lg shadow-[#25D366]/20'}`}
            >
              {isLoading ? 'Configuration en cours...' : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  Connecter WhatsApp avec Meta
                </>
              )}
            </button>
            <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
              En connectant, vous acceptez les conditions de service de WhatsApp Business et la facturation Telnyx associée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
