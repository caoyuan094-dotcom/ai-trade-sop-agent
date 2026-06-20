export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME || "AI Export Agent",
    aiProvider: process.env.AI_PROVIDER || "mock",
    searchProvider: process.env.SEARCH_PROVIDER || "mock",
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    timestamp: new Date().toISOString(),
  });
}
