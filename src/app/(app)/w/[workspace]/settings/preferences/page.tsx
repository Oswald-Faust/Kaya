import type { Metadata } from "next";
import { LanguagePicker } from "@/components/settings/language-picker";
import { SettingsHeader, SettingsSection } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { isLocale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.preferences.metaTitle };
}

export default async function PreferencesPage({ params }: PageProps<"/w/[workspace]/settings/preferences">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const { t } = await getI18n();
  const p = t.settings.preferences;

  return (
    <>
      <SettingsHeader title={p.title} description={p.description} />
      <SettingsSection title={p.languageTitle} description={p.languageHint}>
        <LanguagePicker saved={isLocale(ctx.locale)} />
      </SettingsSection>
    </>
  );
}
