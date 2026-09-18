"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Notice tone="error" title={t.common.pageError.title} action={<Button size="sm" onClick={reset}>{t.common.tryAgain}</Button>}>
        {fmt(t.common.pageError.body, { ref: error.digest ?? t.common.pageError.inLogs })}
      </Notice>
    </div>
  );
}
