import { NextResponse } from "next/server";
import { getPublicRuntimeCapabilities } from "@/lib/server/runtimeCapabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const capabilities = await getPublicRuntimeCapabilities();
  return NextResponse.json(capabilities);
}
