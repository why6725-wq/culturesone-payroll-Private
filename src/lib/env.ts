// 공개 값(URL·anon key)은 브라우저에 노출되도록 설계된 키이므로 기본값을 코드에 둔다. (RLS가 데이터 보호)
// service_role 키는 절대 여기에 두지 말 것 — Vercel 환경변수 SUPABASE_SERVICE_ROLE_KEY 로만 주입.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://thpyqfxqhyadvvanhloo.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocHlxZnhxaHlhZHZ2YW5obG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjA1NDQsImV4cCI6MjEwNDAzNjU0NH0.VcSS7pOUVN5NHWya2uqkhb4SjIOWV0QVHsd8Qrd-kwA";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
