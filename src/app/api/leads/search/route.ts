import { createSearchTask } from "@/lib/lead-engine";
import { createGoogleCustomSearchTask } from "@/lib/search-providers";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const provider = (process.env.SEARCH_PROVIDER || "mock").toLowerCase();

  if (provider === "google-cse" || provider === "google-custom-search") {
    try {
      const result = await createGoogleCustomSearchTask(body);
      return Response.json(result);
    } catch (error) {
      const fallback = createSearchTask(body);
      return Response.json({
        ...fallback,
        workflowLogs: [
          `真实搜索失败，已回退到 mock：${error instanceof Error ? error.message : "unknown error"}`,
          ...fallback.workflowLogs,
        ],
      });
    }
  }

  const result = createSearchTask(body);
  return Response.json(result);
}
