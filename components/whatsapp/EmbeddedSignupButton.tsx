"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

interface EmbeddedSignupButtonProps {
  appId: string;
  configId: string; // The Configuration ID from Meta App Dashboard
  onSuccess?: (accessToken: string) => void;
}

export default function EmbeddedSignupButton({ appId, configId, onSuccess }: EmbeddedSignupButtonProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v19.0", // Use a recent API version for Embedded Signup v4
      });
      setIsSdkLoaded(true);
    };
  }, [appId]);

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      console.error("Facebook SDK not loaded yet.");
      return;
    }

    // Launch Facebook login using the config_id
    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log("Got access token from Meta!");
          if (onSuccess) {
            onSuccess(accessToken);
          }
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      {
        config_id: configId, 
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "WA_EMBEDDED_SIGNUP",
        },
        scope: "business_management,whatsapp_business_management,whatsapp_business_messaging",
      }
    );
  };

  return (
    <>
      <Script
        async
        defer
        crossOrigin="anonymous"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
      />
      <button
        onClick={launchWhatsAppSignup}
        disabled={!isSdkLoaded}
        className="w-full btn btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        {isSdkLoaded ? "Connect WhatsApp" : "Chargement..."}
      </button>
    </>
  );
}
