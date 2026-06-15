import { NextResponse } from "next/server";
import { safePasswordMatches, setAdminCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD nao configurado." }, { status: 503 });
  }

  if (!safePasswordMatches(password)) {
    return NextResponse.json({ error: "Senha invalida." }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
