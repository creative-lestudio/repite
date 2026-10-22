import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión del dueño en cada petición a /app y /auth, y manda a /entrar si no hay sesión.
export async function middleware(request: NextRequest) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export const config = { matcher: ["/app/:path*", "/entrar", "/registro"] };
