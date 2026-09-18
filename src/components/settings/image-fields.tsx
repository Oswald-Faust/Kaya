"use client";

import { removeAvatarAction, removeWorkspaceIconAction, uploadAvatarAction, uploadWorkspaceIconAction } from "@/app/(app)/w/[workspace]/settings/actions";
import { ImageUploader } from "./forms";

export function WorkspaceIconField({ slug, name, src, disabled }: { slug: string; name: string; src: string | null; disabled: boolean }) {
  return <ImageUploader name={name} src={src} shape="square" disabled={disabled} onUpload={(d) => uploadWorkspaceIconAction(slug, d)} onRemove={() => removeWorkspaceIconAction(slug)} />;
}

export function AvatarField({ slug, name, src }: { slug: string; name: string; src: string | null }) {
  return <ImageUploader name={name} src={src} shape="circle" onUpload={(d) => uploadAvatarAction(slug, d)} onRemove={() => removeAvatarAction(slug)} />;
}
