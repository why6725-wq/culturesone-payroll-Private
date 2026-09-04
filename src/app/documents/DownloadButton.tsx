"use client";
import { useState } from "react";
import { getDownloadUrl } from "./actions";

export default function DownloadButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className="btn-outline shrink-0 py-2 text-[14px]" disabled={busy} onClick={async () => {
      setBusy(true); const r = await getDownloadUrl(id); setBusy(false);
      if (r.url) window.location.href = r.url; else alert(r.error);
    }}>{busy ? "준비 중..." : "내려받기"}</button>
  );
}
