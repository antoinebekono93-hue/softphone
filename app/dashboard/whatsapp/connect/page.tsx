'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WhatsAppConnectPage() {
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '123456789012345'; // Configured in .env
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || 'CONFIG_ID';

  useEffect(() => {
    // Load Facebook SDK
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
  }, [appId]);

  const handleConnect = () => {
    if (!isSdkLoaded || !(window as any).FB) {
      setError('Facebook SDK is not loaded yet. Please wait or check your adblocker.');
      return;
    }

    setIsLoading(true);
    setError(null);

    (window as any).FB.login(
      async (response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          
          try {
            // Send the code to our backend.
            // Our backend will exchange it for tokens and get the waba_id/phone_number_id.
            // For the sake of this Telnyx Tech Provider flow, Telnyx actually requires the waba_id and phone_number_id.
            // In a real flow, you would exchange the code here or on the backend to get the WABA ID and Phone Number ID via Meta Graph API,
            // then pass them to /api/whatsapp/tech-provider.
            
            // Simulating the extraction (Meta Graph API exchange should happen on the backend or here)
            // Once we have waba_id and phone_number_id:
            const waba_id = "MOCK_WABA_ID_" + Date.now();
            const phone_number_id = "MOCK_PHONE_ID_" + Date.now();

            const res = await fetch('/api/whatsapp/tech-provider', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                waba_id,
                phone_number_id,
              })
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Failed to register WhatsApp account');
            }

            alert('WhatsApp Business Account successfully connected!');
            router.push('/dashboard/settings');
          } catch (err: any) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        } else {
          setError('User cancelled login or did not fully authorize.');
          setIsLoading(false);
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureV2: '',
          sessionInfoVersion: '3'
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">Connect WhatsApp Business</h1>
        <p className="text-gray-600 mb-6">
          Link your WhatsApp Business Account (WABA) to start sending and receiving messages directly from the CRM.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">WhatsApp Business API</h3>
              <p className="text-sm text-gray-500">Provided by Meta & Telnyx</p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={!isSdkLoaded || isLoading}
            className={`px-4 py-2 rounded-md font-medium text-white transition-colors
              ${(!isSdkLoaded || isLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isLoading ? 'Connecting...' : 'Connect WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
