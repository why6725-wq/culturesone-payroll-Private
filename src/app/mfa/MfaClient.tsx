"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "verify";

export default function MfaClient({ setup }: { setup: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find((f) => f.status === "verified");
      if (verified) { setFactorId(verified.id); setMode("verify"); return; }
      // 미완료 등록이 남아 있으면 정리 후 새로 등록
      for (const f of data?.totp ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data: e, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "NineMC 급여", friendlyName: "관리자 인증앱" });
      if (error || !e) { setErr("인증 수단을 만들지 못했습니다. 다시 시도하세요."); return; }
      setFactorId(e.id); setQr(e.totp.qr_code); setSecret(e.totp.secret); setMode("enroll");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setErr(""); setBusy(true);
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId });
    if (e1 || !ch) { setBusy(false); setErr("인증 요청에 실패했습니다."); return; }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (e2) { setErr("인증 번호가 올바르지 않습니다. 앱의 최신 번호를 입력하세요."); setCode(""); return; }
    router.replace("/admin"); router.refresh();
  };

  if (mode === "loading") return <p className="text-center text-[14px] text-muted">{err || "준비 중..."}</p>;

  return (
    <div className="space-y-4">
      {mode === "enroll" && (
        <>
          <p className="rounded-md bg-[#EEF3F8] px-3 py-2 text-[13px] text-navy">
            급여 정보 보호를 위해 관리자는 2단계 인증이 필요합니다. 폰에 <b>Google Authenticator</b>(또는 Microsoft Authenticator)를 설치하고 아래 QR을 찍으세요.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR 코드" className="mx-auto h-44 w-44 rounded-md border border-line bg-white p-1" />
          <details className="text-[12px] text-muted"><summary className="cursor-pointer">QR을 못 찍으면 키 직접 입력</summary><code className="mt-1 block break-all rounded bg-gray-50 p-2">{secret}</code></details>
        </>
      )}
      <div>
        <label className="label" htmlFor="code">{mode === "enroll" ? "앱에 표시된 6자리 번호" : "인증 앱의 6자리 번호"}</label>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input text-center text-[20px] tracking-[0.4em]"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submit()} autoFocus />
      </div>
      {err && <p className="text-[13px] text-red-600">{err}</p>}
      <button className="btn-primary w-full" disabled={busy || code.length !== 6} onClick={submit}>{busy ? "확인 중..." : mode === "enroll" ? "등록 완료" : "확인"}</button>
      {mode === "verify" && <p className="text-center text-[12px] text-muted">폰을 분실했으면 시스템 담당자에게 초기화를 요청하세요.</p>}
      {setup && mode === "verify" && null}
    </div>
  );
}
