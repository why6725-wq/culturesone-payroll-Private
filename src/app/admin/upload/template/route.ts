import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildHeader, lastDayOf } from "@/lib/payroll/columns";

// 업로드 템플릿: 헤더 + 재직 직원 전원(이메일·이름·지급일=말일)이 미리 채워진 엑셀
export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const y = Number(sp.get("y")) || now.getFullYear();
  const m = Number(sp.get("m")) || now.getMonth() + 1;

  const supabase = createClient();
  const [{ data: items }, { data: emps }] = await Promise.all([
    supabase.from("pay_item_types").select("id, code, name, category, sort_order").eq("is_active", true),
    supabase.from("employees").select("email, name").eq("employment_status", "ACTIVE").order("name")
  ]);

  const header = buildHeader((items ?? []) as any);
  const payDate = lastDayOf(y, m);
  const rows = (emps ?? []).map((e) => [e.email, e.name, payDate, ...Array(header.length - 3).fill("")]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = header.map((h, i) => ({ wch: i === 0 ? 28 : i === 1 ? 10 : Math.max(10, h.length * 2 + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${y}년${m}월`);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`급여업로드_${y}년${m}월.xlsx`)}`
    }
  });
}
