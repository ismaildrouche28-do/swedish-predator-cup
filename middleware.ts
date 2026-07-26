import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isPublic = path === "/login" ||
    path.startsWith("/api/login") ||
    path.startsWith("/api/admin-login") ||
    path.startsWith("/api/set-profile") ||
    path.startsWith("/api/logout") ||
    path.startsWith("/api/debug") ||
    path.startsWith("/_next") ||
    /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(path);
  if (isPublic) return NextResponse.next();

  const appOk = req.cookies.get("spc_app")?.value === "ok";
  if (!appOk) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Wenn App ok, aber kein Profil gewählt → zur Profil-Auswahl
  const hasProfile = !!req.cookies.get("spc_profile")?.value;
  const needsProfile = !path.startsWith("/profil-waehlen") && !path.startsWith("/admin/login");
  if (!hasProfile && needsProfile) {
    const url = req.nextUrl.clone();
    url.pathname = "/profil-waehlen";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
