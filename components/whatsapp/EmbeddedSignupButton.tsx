"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

interface EmbeddedSignupButtonProps {
  appId: string;
  configId?: string;
  onSuccess?: (accessToken: string) => void;
  onError?: (error: any) => void;
}

export function EmbeddedSignupButton({ appId, configId, onSuccess, onError }: EmbeddedSignupButtonProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    // Load the Facebook SDK asynchronously
    if (typeof window !== "undefined") {
      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: "v19.0", // Use latest version
        });
        setIsSdkLoaded(true);
      };

      // Load SDK Script
      (function (d, s, id) {
        let js: any, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs?.parentNode?.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, [appId]);

  const [isLinking, setIsLinking] = useState(false);

  const handleLogin = () => {
    if (!isSdkLoaded || !(window as any).FB) {
      console.error("Facebook SDK not loaded yet.");
      if (onError) onError(new Error("SDK not loaded"));
      return;
    }

    (window as any).FB.login(
      async (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log("WhatsApp Auth Success. Access Token received.");
          
          try {
            setIsLinking(true);
            const res = await fetch("/api/whatsapp/link-account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken })
            });
            
            const data = await res.json();
            if (res.ok) {
              console.log("Telnyx Link Success:", data);
              if (onSuccess) onSuccess(data);
              alert("WhatsApp account successfully linked!");
            } else {
              console.error("Telnyx Link Error:", data);
              if (onError) onError(data);
              alert("Failed to link WhatsApp account.");
            }
          } catch (err) {
            console.error("Request failed", err);
            if (onError) onError(err);
          } finally {
            setIsLinking(false);
          }

        } else {
          console.error("User cancelled login or did not fully authorize.");
          if (onError) onError(new Error("Login cancelled or unauthorized"));
        }
      },
      {
        config_id: configId || "", // Utilisation du configId s'il est fourni
        scopes: "whatsapp_business_management,whatsapp_business_messaging",
        extras: { feature: "whatsapp_embedded_signup" },
      }
    );
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={!isSdkLoaded || isLinking}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${(isSdkLoaded && !isLinking) ? 'bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg' : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] cursor-not-allowed'}`}
    >
      <MessageCircle className="w-5 h-5" />
      {isLinking ? "Liaison en cours..." : isSdkLoaded ? "Connecter WhatsApp" : "Chargement..."}
    </button>
  );
}
