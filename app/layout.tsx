import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura OS — AI Operating System",
  description:
    "Aura OS is an AI-native operating system for managing autonomous agents, missions, tasks, and knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Anti-FOUC script: reads localStorage before React hydrates
          and applies the .dark class immediately to avoid a flash.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aura-theme');var d=t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
