"use server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// 본인 서류 내려받기: 60초짜리 서명 URL 발급 (저장소 정책이 본인 폴더만 허용) + 기록
export async function getDownloadUrl(id: string): Promise<{ url?: string; error?: string }> {
  await requireUser();
  const sb = createClient();
  const { data: d } = await sb.from("employee_documents").select("storage_path, file_name").eq("id", id).maybeSingle();
  if (!d) return { error: "서류를 찾을 수 없습니다." };
  const { data, error } = await sb.storage.from("employee-docs").createSignedUrl(d.storage_path, 60, { download: d.file_name });
  if (error || !data) return { error: "다운로드 링크를 만들지 못했습니다." };
  await sb.rpc("log_document_download", { p_id: id });
  return { url: data.signedUrl };
}
