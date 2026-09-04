"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function registerDocument(input: { employeeId: string; category: string; year: number | null; title: string; storagePath: string; fileName: string; fileSize: number }) {
  await requireAdmin();
  const { error } = await createClient().rpc("admin_add_document", {
    p_employee_id: input.employeeId, p_category: input.category, p_year: input.year, p_title: input.title,
    p_storage_path: input.storagePath, p_file_name: input.fileName, p_file_size: input.fileSize
  });
  revalidatePath("/admin/documents"); revalidatePath("/documents");
  return { error: error?.message.replace(/^.*?: /, "") };
}

export async function deleteDocument(id: string, reason: string) {
  await requireAdmin();
  const sb = createClient();
  const { data: path, error } = await sb.rpc("admin_delete_document", { p_id: id, p_reason: reason });
  if (error) return { error: error.message.replace(/^.*?: /, "") };
  await sb.storage.from("employee-docs").remove([path as string]);   // 실제 파일 제거 (메타는 소프트 삭제로 기록 유지)
  revalidatePath("/admin/documents"); revalidatePath("/documents");
  return {};
}
