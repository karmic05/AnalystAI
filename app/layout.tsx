import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnalystAI · Your AI Business Analyst",
  description:
    "Upload your data. Get an AI business analyst that generates insights, dashboards, forecasts, and executive reports. No spreadsheets, no SQL, no data team required.",
  applicationName: "AnalystAI",
  openGraph: {
    title: "AnalystAI · Your AI Business Analyst",
    description:
      "Drop a CSV. Get insights, dashboards, forecasts and a board-ready report in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfbfd",
  width: "device-width",
  initialScale: 1,
};

/**
 * No-flash theme bootstrap. Runs before paint to set the right theme for the
 * surface the user landed on: marketing pages default to light, the Studio
 * defaults to dark. A stored per-surface override wins. Mirrors the logic in
 * components/theme-provider.tsx — keep the keys/defaults in sync.
 */
const themeBootstrap = `(function(){try{var p=location.pathname||'/';var studio=p.indexOf('/studio')===0;var key=studio?'analystai-theme-studio':'analystai-theme-marketing';var def=studio?'dark':'light';var t=localStorage.getItem(key)||def;document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-bg text-ink font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
