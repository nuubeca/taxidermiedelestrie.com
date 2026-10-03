import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/gestion", "/mon-compte"];

/**
 * Rafraîchit la session Supabase à chaque requête et redirige vers /connexion
 * pour les zones protégées. La vérification du rôle se fait dans les layouts.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/connexion";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  if (pathname === "/connexion" && user) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = request.nextUrl.clone();
    dest.pathname = next && next.startsWith("/") ? next : "/mon-compte";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return response;
}

export const config = {
  // Seulement les routes qui dépendent de la session : le catalogue reste statique et sans latence.
  matcher: ["/gestion/:path*", "/mon-compte/:path*", "/connexion", "/commande"],
};
