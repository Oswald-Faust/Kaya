"use client";

import { useEffect } from "react";
import { setStoredNavAuth } from "@/lib/nav-auth";

export function WorkspaceNavSync({ workspaceSlug }: { workspaceSlug: string }) {
  useEffect(() => {
    if (workspaceSlug) {
      setStoredNavAuth({
        appHref: `/w/${workspaceSlug}`,
        authenticated: true,
      });
    }
  }, [workspaceSlug]);

  return null;
}
