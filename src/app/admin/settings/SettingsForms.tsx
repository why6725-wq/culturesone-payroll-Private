"use client";
import { useFormState } from "react-dom";
import { updateCompany, updateTemplate } from "../certificates/actions";
import { CERT_TYPE_LABEL } from "@/lib/certificates";

type S = { error?: string; ok?: string };

export default function SettingsForms({ company, templates }: { company: any; templates: { type: string; title: string; statement: string }[] }) {
  const [cs, cAction] = useFormState<S, FormData>(updateCompany, {});
  return (
    <div className="mt-5 space-y-6">
      <form action={cAction} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-[15px] font-semibold sm:col-span-2">회사 정보 (증명서 하단 표시)</h2>
        <F label="회사명(법인명)" name="company_name" v={company.company_name} />
        <F label="브랜드명" name="brand_name" v={company.brand_name} />
        <F label="대표자 성명" name="ceo_name" v={company.ceo_name} ph="홍길동" />
        <F label="발급자 직함" name="issuer_title" v={company.issuer_title} />
        <F label="사업자등록번호" name="biz_no" v={company.biz_no} ph="000-00-00000" />
        <F label="전화번호" name="phone" v={company.phone} />
        <F label="발급 담당자 (경력증명서 표시, 선택)" name="issuer_contact" v={company.issuer_contact} ph="홍길동 사원(010-0000-0000)" />
        <div className="sm:col-span-2"><F label="주소" name="address" v={company.address} /></div>
        {cs.error && <p className="text-[13px] text-red-600 sm:col-span-2">{cs.error}</p>}
        {cs.ok && <p className="text-[13px] text-emerald-800 sm:col-span-2">{cs.ok}</p>}
        <div className="sm:col-span-2"><button className="btn-primary">회사 정보 저장</button></div>
      </form>
      {templates.map((t) => <TemplateForm key={t.type} t={t} />)}
    </div>
  );
}

function TemplateForm({ t }: { t: { type: string; title: string; statement: string } }) {
  const [s, action] = useFormState<S, FormData>(updateTemplate, {});
  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="text-[15px] font-semibold">{CERT_TYPE_LABEL[t.type]} 양식</h2>
      <input type="hidden" name="type" value={t.type} />
      <F label="문서 제목" name="title" v={t.title} />
      <div><label className="label" htmlFor={`st_${t.type}`}>확인 문구</label>
        <textarea id={`st_${t.type}`} name="statement" rows={2} className="input" defaultValue={t.statement} /></div>
      {s.error && <p className="text-[13px] text-red-600">{s.error}</p>}
      {s.ok && <p className="text-[13px] text-emerald-800">{s.ok}</p>}
      <div><button className="btn-outline">양식 저장</button></div>
    </form>
  );
}

function F({ label, name, v, ph }: { label: string; name: string; v: string; ph?: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><input id={name} name={name} className="input" defaultValue={v ?? ""} placeholder={ph} /></div>;
}
