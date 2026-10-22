import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/schemas/auth";
import { createUserClient } from "@/lib/supabase/server";

// Destino de los enlaces del correo (confirmación de cuenta y acceso sin contraseña)
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("siguiente"));
  if (code) {
    const supabase = await createUserClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", request.url));
}
