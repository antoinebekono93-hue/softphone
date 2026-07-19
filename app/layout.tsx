import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TelnyxProvider } from "@/contexts/TelnyxContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Antigravity — Cloud Softphone for Business",
    template: "%s | Antigravity",
  },
  description:
    "Professional cloud-based softphone platform. Make and receive business calls from anywhere — browser, mobile, or desktop. Powered by Telnyx.",
  keywords: [
    "softphone",
    "cloud phone",
    "business phone",
    "VoIP",
    "Telnyx",
    "PWA",
    "call center",
  ],
  authors: [{ name: "Mego" }],
  creator: "Mego",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Antigravity",
    title: "Antigravity — Cloud Softphone for Business",
    description:
      "Professional cloud-based softphone. Make and receive calls from your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Antigravity — Cloud Softphone for Business",
    description:
      "Professional cloud-based softphone. Make and receive calls from your browser.",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans`}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <LanguageProvider>
              <TelnyxProvider>
                {children}
              </TelnyxProvider>
            </LanguageProvider>
          </AuthProvider>
          <Toaster position="top-center" theme="dark" />
        </ThemeProvider>
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
