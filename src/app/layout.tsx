import type { Metadata } from "next";
import { Geist_Mono, Host_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { I18nProvider } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import "./globals.css";

const host = Host_Grotesk({
  variable: "--font-host",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: "Kaya", template: "%s · Kaya" }, description: t.meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className={`${host.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        <I18nProvider locale={locale} dictionary={t}>
          <ImpersonationBanner />
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
