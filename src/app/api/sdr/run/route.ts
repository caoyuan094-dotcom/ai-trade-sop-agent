import { createSdrSop } from "@/lib/sdr-sop-engine";
import type { SdrBaseInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

type SdrRunRequest = {
  baseInfo?: Partial<SdrBaseInfo>;
  targetCount?: number;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SdrRunRequest | null;

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createSdrSop(body.baseInfo || {}, body.targetCount || 25);
  return Response.json(result);
}
