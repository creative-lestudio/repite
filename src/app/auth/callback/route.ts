import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/schemas/auth";
import { createUserClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "magiclink", "email", "recovery", "invite"];

// Destino de los enlaces del correo (alta y acceso). Admite dos formas:
//  - `token_hash` + `type` (plantilla propia: funciona aunque se abra en otro dispositivo)
//  - `code` (flujo PKCE de Supabase: solo en el mismo navegador donde se pidió el enlace)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("siguiente"));
  const supabase = await createUserClient();

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", request.url));
}
