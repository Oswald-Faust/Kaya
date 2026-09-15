"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Notice tone="error" title="This page couldn't load" action={<Button size="sm" onClick={reset}>Try again</Button>}>
        No action was taken. If this keeps happening, the reference {error.digest ? <code>{error.digest}</code> : "in the server logs"} helps locate it.
      </Notice>
    </div>
  );
}
