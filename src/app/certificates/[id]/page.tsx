import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import CertificateViewer from "@/components/CertificateViewer";

// 발급본 상세. RLS로 본인(또는 관리자) 것만 조회됨.
export default async function CertificatePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const { data: r } = await createClient().from("certificate_requests")
    .select("id, type, purpose, status, issue_no, issued_at, snapshot").eq("id", params.id).maybeSingle();
  if (!r || r.status !== "ISSUED" || !r.snapshot) notFound();
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4 sm:py-6">
        <CertificateViewer id={r.id} type={r.type} purpose={r.purpose} issueNo={r.issue_no} issuedAt={r.issued_at} snapshot={r.snapshot}
          backHref={user.role === "ADMIN" ? "/admin/certificates" : "/certificates"} />
      </main>
    </>
  );
}
