import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SettingsForms from "./SettingsForms";
import ItemTypesManager from "./ItemTypesManager";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const sb = createClient();
  const [{ data: company }, { data: templates }, { data: items }] = await Promise.all([
    sb.from("company_settings").select("*").eq("id", 1).single(),
    sb.from("certificate_templates").select("type, title, statement").order("type"),
    sb.from("pay_item_types").select("id, name, category, sort_order, is_active").order("category").order("sort_order")
  ]);
  return (
    <>
      <main className="max-w-3xl px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">회사정보 · 증명서 양식</h1>
        <p className="mt-1 text-[14px] text-muted">여기서 바꾼 내용은 이후 발급되는 증명서부터 적용됩니다. 이미 발급된 증명서는 발급 당시 내용이 그대로 유지됩니다.</p>
        <SettingsForms company={company} templates={(templates ?? []) as any} />
        <ItemTypesManager items={(items ?? []) as any} />
      </main>
    </>
  );
}
