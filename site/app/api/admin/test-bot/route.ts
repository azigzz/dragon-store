import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSiteConfig } from "@/lib/config";
import { fetchBotStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const current = await readSiteConfig();
  const config = {
    ...current,
    botApiUrl: String(body.botApiUrl || current.botApiUrl || ""),
    botApiToken: String(body.botApiToken || current.botApiToken || "")
  };

  try {
    const store = await fetchBotStore(config);
    return NextResponse.json({ ok: true, products: store.products?.length || 0, title: store.title || store.storeName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao testar bot.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
