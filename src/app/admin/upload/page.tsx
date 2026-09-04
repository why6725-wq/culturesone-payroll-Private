import { requireAdmin } from "@/lib/auth";
import UploadClient from "./UploadClient";

export default async function UploadPage({ searchParams }: { searchParams: { y?: string; m?: string } }) {
  const user = await requireAdmin();
  const now = new Date();
  const y = Number(searchParams.y) || now.getFullYear();
  const m = Number(searchParams.m) || now.getMonth() + 1;
  return (
    <>
      <main className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">{y}년 {m}월 급여 엑셀 업로드</h1>
        <UploadClient year={y} month={m} />
      </main>
    </>
  );
}
