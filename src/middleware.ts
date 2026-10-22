import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión del dueño en cada petición a /app y /auth, y manda a /entrar si no hay sesión.
export async function middleware(request: NextRequest) {
  // Si el enlace del correo cae en la portada (URL no permitida en Supabase), lo reenviamos al callback
  if (request.nextUrl.pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.search = `?code=${encodeURIComponent(code)}&siguiente=/app/empezar`;
    return NextResponse.redirect(url);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  // Refresca la sesión y la valida (en local si las claves de Supabase lo permiten)
  const { data: auth } = await supabase.auth.getClaims();
  const user = auth?.claims?.sub ? auth.claims : null;

  const path = request.nextUrl.pathname;
  if (path.startsWith("/app") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?siguiente=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if ((path === "/entrar" || path === "/registro") && user) {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  return response;
}

export const config = { matcher: ["/", "/app/:path*", "/entrar", "/registro"] };
