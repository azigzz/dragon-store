import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSiteConfig, saveSiteConfig, toAdminPayload } from "@/lib/config";
import type { SiteConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  return NextResponse.json(toAdminPayload(await readSiteConfig()));
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Partial<SiteConfig> | null;
  if (!body) return NextResponse.json({ error: "JSON invalido." }, { status: 400 });

  try {
    const saved = await saveSiteConfig(body);
    return NextResponse.json(toAdminPayload(saved));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel salvar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
