import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";

const ADMIN_PREFIXES = ["/dashboard", "/produk", "/laporan", "/pengaturan", "/pengguna"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  const isApiLogin = path.startsWith("/api/login");

  if (!session.userId && !isLogin && !isApiLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Kasir tidak boleh halaman admin (rute halaman, bukan /api)
  if (session.userId && session.role !== "admin" && ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/kasir", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
