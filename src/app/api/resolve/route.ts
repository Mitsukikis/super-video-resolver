import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { resolverPlugins } from "@/lib/resolvers/registry";
import { createResolveService } from "@/lib/server/resolveService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = createResolveService(resolverPlugins);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const manifest = await service.resolve({
      url: String(body.url ?? ""),
      temporaryCookie: body.temporaryCookie ? String(body.temporaryCookie) : undefined,
      isLoggedIn: await isLoggedIn(),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    });

    return NextResponse.json({ ok: true, manifest });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "解析失败" },
      { status: 400 }
    );
  }
}
