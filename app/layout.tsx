import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GlobalIncomingCall } from "@/components/softphone/GlobalIncomingCall";
import { GlobalAppIncomingCall } from "@/components/softphone/GlobalAppIncomingCall";
import { TelnyxProvider } from "@/contexts/TelnyxContext";
import { AppCallProvider } from "@/contexts/AppCallContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { validateEnv } from "@/lib/env-validation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

validateEnv();

export const metadata: Metadata = {
  title: {
    default: "Antigravity — Téléphonie professionnelle et agents vocaux IA",
    template: "%s | Antigravity",
  },
  description:
    "Plateforme B2B de communication d'entreprise : numéros professionnels, softphone cloud, routage d'appels, SMS et WhatsApp, agents vocaux assistés par intelligence artificielle.",
  keywords: [
    "softphone",
    "téléphonie professionnelle",
    "centre d'appels",
    "standard téléphonique",
    "répondeur IA",
    "agent vocal IA",
    "WhatsApp Business",
    "PWA",
  ],
  authors: [{ name: "Antigravity" }],
  creator: "Antigravity",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Antigravity",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Antigravity",
    title: "Antigravity — Téléphonie professionnelle et agents vocaux IA",
    description:
      "Numéros professionnels, softphone cloud, routage d'appels, messagerie multicanal et agents vocaux assistés par intelligence artificielle.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Antigravity — Téléphonie professionnelle et agents vocaux IA",
    description:
      "Numéros professionnels, softphone cloud, routage d'appels et agents vocaux assistés par intelligence artificielle.",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-180x180.png",
    shortcut: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Permet à l'app de s'étendre sous la barre de statut iOS (type island etc.)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme init (avant paint pour éviter le flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("vite-ui-theme");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <LanguageProvider>
              <AppCallProvider>
                <TelnyxProvider>
                  {children}
                  <GlobalIncomingCall />
                  <GlobalAppIncomingCall />
                  <PwaInstallBanner />
                </TelnyxProvider>
              </AppCallProvider>
            </LanguageProvider>
          </AuthProvider>
          <Toaster position="top-center" theme="dark" />
        </ThemeProvider>
        {/* NOTE: Le Service Worker est enregistré automatiquement par @ducanh2912/next-pwa
            via next.config.ts (register: true). Aucun enregistrement manuel nécessaire. */}
      </body>
    </html>
  );
}
