import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Pemeriksaan optimistis: hanya tanda tangan cookie, tanpa query database.
// Otorisasi sebenarnya ada di src/lib/dal.ts.

const PUBLIC_PATHS = ["/login", "/register"];

async function hasSignedSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("gu_session")?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (await hasSignedSession(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|manifest.webmanifest).*)"],
};
